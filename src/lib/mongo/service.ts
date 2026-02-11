import { MongoClient, type Db } from "mongodb";
import type { NormalizedArtist } from "@/types/spotify";

declare global {
  var __mongoClientPromise__: Promise<MongoClient> | undefined;
}

let mongoClientPromise: Promise<MongoClient> | undefined;
const MISSING_ARTISTS_COLLECTION = "artists_without_cover";

export interface ArtistWithoutCoverDocument {
  artistId: string;
  name: string;
  normalizedName: string;
  imageUrl: string | null;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

function getMongoUri(): string {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("Missing MONGO_URI environment variable");
  }
  return mongoUri;
}

export function getMongoClient(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    if (!global.__mongoClientPromise__) {
      const client = new MongoClient(getMongoUri());
      global.__mongoClientPromise__ = client.connect();
    }
    return global.__mongoClientPromise__;
  }

  if (!mongoClientPromise) {
    const client = new MongoClient(getMongoUri());
    mongoClientPromise = client.connect();
  }

  return mongoClientPromise;
}

export async function getMongoDb(dbName?: string): Promise<Db> {
  const client = await getMongoClient();
  return client.db(dbName);
}

function normalizeArtistName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

export function getArtistsWithoutCover(
  artists: Pick<NormalizedArtist, "id" | "name" | "imageUrl">[],
): Pick<NormalizedArtist, "id" | "name" | "imageUrl">[] {
  return artists.filter((artist) => !artist.imageUrl);
}

export async function saveArtistsWithoutCover(
  artists: Pick<NormalizedArtist, "id" | "name" | "imageUrl">[],
  source = "spotify",
): Promise<number> {
  const missingArtists = getArtistsWithoutCover(artists);
  if (missingArtists.length === 0) {
    return 0;
  }

  const dedupedArtists = new Map<
    string,
    Pick<NormalizedArtist, "id" | "name" | "imageUrl">
  >();
  for (const artist of missingArtists) {
    dedupedArtists.set(normalizeArtistName(artist.name), artist);
  }

  const db = await getMongoDb();
  const collection = db.collection<ArtistWithoutCoverDocument>(
    MISSING_ARTISTS_COLLECTION,
  );
  await collection.createIndex({ normalizedName: 1 }, { unique: true });

  const now = new Date();
  const operations = Array.from(dedupedArtists.entries()).map(
    ([normalizedName, artist]) => ({
      updateOne: {
        filter: { normalizedName },
        update: {
          $set: {
            name: artist.name,
            source,
            updatedAt: now,
          },
          $setOnInsert: {
            artistId: artist.id,
            imageUrl: null,
            normalizedName,
            createdAt: now,
          },
        },
        upsert: true,
      },
    }),
  );

  const result = await collection.bulkWrite(operations, { ordered: false });
  return result.upsertedCount + result.modifiedCount;
}

export async function getStoredArtistsWithoutCover(
  limit = 200,
): Promise<ArtistWithoutCoverDocument[]> {
  const db = await getMongoDb();
  const collection = db.collection<ArtistWithoutCoverDocument>(
    MISSING_ARTISTS_COLLECTION,
  );

  return collection
    .find({
      $or: [
        { imageUrl: null },
        { imageUrl: { $exists: false } },
        { imageUrl: "" },
      ],
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}
