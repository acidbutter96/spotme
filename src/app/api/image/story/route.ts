import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";
import { getServerAccessToken } from "@/lib/auth";
import {
  getBestArtistImage,
  getArtistInfo,
  getTopArtists as getLastFmTopArtists,
  LastFmApiError,
  type LastFmPeriod,
} from "@/lib/lastfm/client";
import { getAudioDbArtistImage } from "@/lib/audiodb/client";
import { getWikidataArtistImage } from "@/lib/wikidata/client";
import { getTopArtists, searchArtistImage } from "@/lib/spotify/client";
import { normalizeArtist } from "@/lib/spotify/normalize";
import { getTopArtist, getTopGenres } from "@/lib/stats/aggregations";
import { renderTemplate } from "@/lib/image/templates";
import type { NormalizedArtist, SpotifyTimeRange } from "@/types/spotify";
import type { StoryTemplate } from "@/lib/image/templates";

export const runtime = "edge";

const ALLOWED_TIME_RANGES: SpotifyTimeRange[] = [
  "short_term",
  "medium_term",
  "long_term",
];

const PERIOD_LABELS: Record<SpotifyTimeRange, string> = {
  short_term: "This Month",
  medium_term: "Last 6 Months",
  long_term: "All Time",
};

const ALLOWED_TEMPLATES: StoryTemplate[] = ["top-artist", "top-artists-grid"];
const ALLOWED_SOURCES = ["spotify", "lastfm"] as const;

const LASTFM_PERIODS: Record<SpotifyTimeRange, LastFmPeriod> = {
  short_term: "1month",
  medium_term: "6month",
  long_term: "overall",
};

const LASTFM_IMAGE_TILE_LIMIT = 12;

function isLikelyLastFmImageHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.includes("lastfm") ||
      parsed.hostname.includes("fastly.net")
    );
  } catch {
    return false;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    let chunkString = "";
    for (let j = 0; j < chunk.length; j += 1) {
      chunkString += String.fromCharCode(chunk[j] ?? 0);
    }
    binary += chunkString;
  }
  return btoa(binary);
}

async function inlineIfOgCompatibleLastFmImage(
  url: string | null,
): Promise<string | null> {
  if (!url) {
    return null;
  }
  if (!isLikelyLastFmImageHost(url)) {
    return url;
  }

  try {
    const response = await fetch(url, {
      headers: {
        // Some CDNs block requests with missing/empty UA.
        "user-agent":
          "Mozilla/5.0 (compatible; MusicStoriesBot/1.0; +http://127.0.0.1)",
        // Prefer jpeg/png/gif because @vercel/og can fail on webp/avif.
        // Avoid generic `image/*` so CDNs don't negotiate WebP by default.
        accept: "image/jpeg,image/png,image/gif;q=0.9",
      },
      // This is user-specific and can vary; avoid caching edge-side here.
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type")?.toLowerCase();
    if (!contentType) {
      return null;
    }

    // @vercel/og supports png/jpeg/gif well; webp/avif frequently break.
    // If the CDN ignores our `Accept` and still returns an unsupported type,
    // drop it so we can fall back to another image source.
    const isSupported =
      contentType.includes("image/png") ||
      contentType.includes("image/jpeg") ||
      contentType.includes("image/jpg") ||
      contentType.includes("image/gif");
    if (!isSupported) {
      return null;
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      const length = Number(contentLength);
      if (Number.isFinite(length) && length > 2_500_000) {
        // Keep memory bounded in the edge runtime.
        return null;
      }
    }

    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 2_500_000) {
      return null;
    }
    const base64 = arrayBufferToBase64(bytes);
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

function isSpotifyTimeRange(value: string | null): value is SpotifyTimeRange {
  return (
    value !== null &&
    (ALLOWED_TIME_RANGES as readonly string[]).includes(value)
  );
}

function isStoryTemplate(value: string | null): value is StoryTemplate {
  return (
    value !== null && (ALLOWED_TEMPLATES as readonly string[]).includes(value)
  );
}

function isSource(
  value: string | null,
): value is (typeof ALLOWED_SOURCES)[number] {
  return (
    value !== null && (ALLOWED_SOURCES as readonly string[]).includes(value)
  );
}

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const periodParam = params.get("period");
    const templateParam = params.get("template");
    const sourceParam = params.get("source");

    const period: SpotifyTimeRange = isSpotifyTimeRange(periodParam)
      ? periodParam
      : "short_term";
    const template: StoryTemplate = isStoryTemplate(templateParam)
      ? templateParam
      : "top-artists-grid";
    const source = isSource(sourceParam) ? sourceParam : "spotify";

    let normalizedArtists: NormalizedArtist[] = [];
    let topGenres: Array<{ genre: string; count: number }> = [];

    if (source === "lastfm") {
      const username = params.get("username");
      if (!username) {
        return new Response("Missing Last.fm username", { status: 400 });
      }

      const fallbackSpotifyToken = await getServerAccessToken(req);
      const topArtists = await getLastFmTopArtists(
        username,
        LASTFM_PERIODS[period],
      );
      const rawArtists = topArtists.topartists.artist;
      normalizedArtists = await Promise.all(
        rawArtists.map(async (artist, index) => {
          // The story templates only render the first 12 tiles.
          if (index >= LASTFM_IMAGE_TILE_LIMIT) {
            return {
              id: artist.mbid || `${artist.name}-${index}`,
              name: artist.name,
              genres: [],
              popularity: Number(artist.playcount ?? 0),
              imageUrl: null,
            };
          }

          let imageUrl = await inlineIfOgCompatibleLastFmImage(
            getBestArtistImage(artist.image),
          );
          if (!imageUrl) {
            try {
              const info = await getArtistInfo({
                mbid: artist.mbid || undefined,
                name: artist.name,
              });
              imageUrl = await inlineIfOgCompatibleLastFmImage(
                getBestArtistImage(info.artist.image),
              );
            } catch (error) {
              const shouldLog =
                !(error instanceof LastFmApiError) ||
                // Common/expected for some names and missing MBIDs.
                (error.code !== 6 && error.code !== 7);

              if (shouldLog) {
                console.error("Last.fm artist.getinfo failed", error);
              }
            }
          }
          if (!imageUrl) {
            try {
              imageUrl = await getAudioDbArtistImage({
                mbid: artist.mbid || undefined,
                name: artist.name,
              });
            } catch (error) {
              console.error("TheAudioDB artist lookup failed", error);
            }
          }
          if (!imageUrl) {
            try {
              imageUrl = await getWikidataArtistImage({
                name: artist.name,
              });
            } catch (error) {
              console.error("Wikidata artist lookup failed", error);
            }
          }
          if (!imageUrl && fallbackSpotifyToken) {
            try {
              imageUrl = await searchArtistImage(
                artist.name,
                fallbackSpotifyToken,
              );
            } catch (error) {
              console.error("Spotify artist search failed", error);
            }
          }

          return {
            id: artist.mbid || `${artist.name}-${index}`,
            name: artist.name,
            genres: [],
            popularity: Number(artist.playcount ?? 0),
            imageUrl,
          };
        }),
      );
    } else {
      const accessToken = await getServerAccessToken(req);
      if (!accessToken) {
        return new Response("Unauthorized", { status: 401 });
      }

      const topArtists = await getTopArtists(period, accessToken);
      normalizedArtists = topArtists.items.map(normalizeArtist);
      topGenres = getTopGenres(normalizedArtists);
    }

    const topArtist = getTopArtist(normalizedArtists);

    const image = renderTemplate(template, {
      periodLabel: PERIOD_LABELS[period],
      topArtist: topArtist
        ? { name: topArtist.name, imageUrl: topArtist.imageUrl }
        : null,
      topArtists: normalizedArtists.slice(0, 12).map((artist) => ({
        name: artist.name,
        imageUrl: artist.imageUrl,
      })),
      topGenres,
    });

    return new ImageResponse(image, {
      width: 1080,
      height: 1920,
    });
  } catch (error) {
    console.error(error);
    return new Response("Failed to generate story", { status: 500 });
  }
}
