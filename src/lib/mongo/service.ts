import {
  MongoClient,
  type Db,
  type ObjectId,
  type WithId,
} from "mongodb";
import type { NormalizedArtist } from "@/types/spotify";

declare global {
  var __mongoClientPromise__: Promise<MongoClient> | undefined;
}

let mongoClientPromise: Promise<MongoClient> | undefined;
const MISSING_ARTISTS_COLLECTION = "artists_without_cover";
const LASTFM_USERS_COLLECTION = "lastfm_users";
const LASTFM_PERIOD_ARTISTS_COLLECTION = "lastfm_period_artists";

export interface ArtistWithoutCoverDocument {
  artistId: string;
  name: string;
  normalizedName: string;
  imageUrl: string | null;
  source: string;
  firstSeenByUserId?: ObjectId;
  firstSeenByUsername?: string;
  firstSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LastFmUserDocument {
  username: string;
  normalizedUsername: string;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt: Date;
}

export interface LastFmPeriodArtist {
  artistId: string;
  name: string;
  imageUrl: string | null;
  popularity: number;
}

export interface LastFmPeriodArtistsDocument {
  userId: ObjectId;
  username: string;
  normalizedUsername: string;
  period: string;
  artists: LastFmPeriodArtist[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SaveArtistsWithoutCoverOptions {
  source?: string;
  firstSeenByUserId?: ObjectId;
  firstSeenByUsername?: string;
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

function normalizeLastFmUsername(username: string): string {
  return username.trim().toLocaleLowerCase();
}

export function getArtistsWithoutCover(
  artists: Pick<NormalizedArtist, "id" | "name" | "imageUrl">[],
): Pick<NormalizedArtist, "id" | "name" | "imageUrl">[] {
  return artists.filter((artist) => !artist.imageUrl);
}

export async function upsertLastFmUser(
  username: string,
): Promise<WithId<LastFmUserDocument>> {
  const sanitizedUsername = username.trim();
  if (!sanitizedUsername) {
    throw new Error("Last.fm username is required");
  }

  const normalizedUsername = normalizeLastFmUsername(sanitizedUsername);
  const db = await getMongoDb();
  const usersCollection = db.collection<LastFmUserDocument>(
    LASTFM_USERS_COLLECTION,
  );
  await usersCollection.createIndex({ normalizedUsername: 1 }, { unique: true });

  const now = new Date();
  const user = await usersCollection.findOneAndUpdate(
    { normalizedUsername },
    {
      $set: {
        username: sanitizedUsername,
        normalizedUsername,
        updatedAt: now,
        lastSeenAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    },
  );

  if (!user) {
    throw new Error("Failed to upsert Last.fm user");
  }

  return user;
}

export async function saveLastFmPeriodArtists(input: {
  userId: ObjectId;
  username: string;
  period: string;
  artists: LastFmPeriodArtist[];
}): Promise<void> {
  const normalizedUsername = normalizeLastFmUsername(input.username);
  const dedupedArtists = new Map<string, LastFmPeriodArtist>();
  for (const artist of input.artists) {
    dedupedArtists.set(normalizeArtistName(artist.name), artist);
  }

  const db = await getMongoDb();
  const collection = db.collection<LastFmPeriodArtistsDocument>(
    LASTFM_PERIOD_ARTISTS_COLLECTION,
  );
  await collection.createIndex({ userId: 1, period: 1 }, { unique: true });

  const now = new Date();
  await collection.updateOne(
    {
      userId: input.userId,
      period: input.period,
    },
    {
      $set: {
        username: input.username,
        normalizedUsername,
        artists: Array.from(dedupedArtists.values()),
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );
}

export async function saveArtistsWithoutCover(
  artists: Pick<NormalizedArtist, "id" | "name" | "imageUrl">[],
  options: SaveArtistsWithoutCoverOptions = {},
): Promise<number> {
  const source = options.source ?? "spotify";
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
            ...(options.firstSeenByUserId
              ? { firstSeenByUserId: options.firstSeenByUserId }
              : {}),
            ...(options.firstSeenByUsername
              ? { firstSeenByUsername: options.firstSeenByUsername }
              : {}),
            firstSeenAt: now,
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
