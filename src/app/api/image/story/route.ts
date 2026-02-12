import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";
import { getServerAccessToken } from "@/lib/auth";
import {
  getBestArtistImage,
  getArtistInfo,
  getTopArtists as getLastFmTopArtists,
  getTopArtistsByDateRange,
  LastFmApiError,
  type LastFmArtist,
  type LastFmPeriod,
} from "@/lib/lastfm/client";
import { getAudioDbArtistImage } from "@/lib/audiodb/client";
import { getWikidataArtistImage } from "@/lib/wikidata/client";
import { getTopArtists, searchArtistImage } from "@/lib/spotify/client";
import { normalizeArtist } from "@/lib/spotify/normalize";
import { getTopArtist, getTopGenres } from "@/lib/stats/aggregations";
import {
  saveArtistsWithoutCover,
  saveLastFmPeriodArtists,
  upsertLastFmUser,
} from "@/lib/mongo/service";
import { renderTemplate } from "@/lib/image/templates";
import type { NormalizedArtist, SpotifyTimeRange } from "@/types/spotify";
import type { StoryTemplate } from "@/lib/image/templates";

export const runtime = "nodejs";

type StoryPeriod =
  | SpotifyTimeRange
  | "week"
  | "15days"
  | "30days"
  | "year"
  | "last_year"
  | "specific_year";

const ALLOWED_PERIODS: StoryPeriod[] = [
  "week",
  "15days",
  "30days",
  "short_term",
  "medium_term",
  "year",
  "last_year",
  "specific_year",
  "long_term",
];

const PERIOD_LABELS: Record<StoryPeriod, string> = {
  week: "This Week",
  "15days": "Last 15 Days",
  "30days": "Last 30 Days",
  short_term: "This Month",
  medium_term: "Last 6 Months",
  year: "This Year",
  last_year: "Last Year",
  specific_year: "Specific Year",
  long_term: "All Time",
};

const ALLOWED_TEMPLATES: StoryTemplate[] = ["top-artist", "top-artists-grid"];
const ALLOWED_SOURCES = ["spotify", "lastfm"] as const;

const LASTFM_PERIODS: Record<StoryPeriod, LastFmPeriod> = {
  week: "7day",
  "15days": "1month",
  "30days": "1month",
  short_term: "1month",
  medium_term: "6month",
  year: "12month",
  last_year: "12month",
  specific_year: "overall",
  long_term: "overall",
};

const LASTFM_IMAGE_TILE_LIMIT = 12;
const LASTFM_FIRST_YEAR = 2002;

interface LastFmDateRange {
  from: number;
  to: number;
}

function toUnixSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

function getStartOfUtcWeek(date: Date): Date {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = start.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  return start;
}

function getStartOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function getStartOfUtcYear(year: number): Date {
  return new Date(Date.UTC(year, 0, 1));
}

function subtractDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}

function subtractMonthsUtc(date: Date, months: number): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() - months,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
    ),
  );
}

function getUtcYearRange(year: number, now: Date): LastFmDateRange {
  const start = getStartOfUtcYear(year);
  if (year === now.getUTCFullYear()) {
    return { from: toUnixSeconds(start), to: toUnixSeconds(now) };
  }

  const nextYear = getStartOfUtcYear(year + 1);
  return { from: toUnixSeconds(start), to: toUnixSeconds(nextYear) - 1 };
}

function getLastFmDateRangeForPeriod(
  period: StoryPeriod,
  selectedYear: number | null,
  now = new Date(),
): LastFmDateRange | null {
  const nowSeconds = toUnixSeconds(now);

  switch (period) {
    case "week":
      return {
        from: toUnixSeconds(getStartOfUtcWeek(now)),
        to: nowSeconds,
      };
    case "15days":
      return {
        from: toUnixSeconds(subtractDays(now, 15)),
        to: nowSeconds,
      };
    case "30days":
      return {
        from: toUnixSeconds(subtractDays(now, 30)),
        to: nowSeconds,
      };
    case "short_term":
      return {
        from: toUnixSeconds(getStartOfUtcMonth(now)),
        to: nowSeconds,
      };
    case "medium_term":
      return {
        from: toUnixSeconds(subtractMonthsUtc(now, 6)),
        to: nowSeconds,
      };
    case "year":
      return getUtcYearRange(now.getUTCFullYear(), now);
    case "last_year":
      return getUtcYearRange(now.getUTCFullYear() - 1, now);
    case "specific_year": {
      const resolvedYear = selectedYear ?? now.getUTCFullYear();
      return getUtcYearRange(resolvedYear, now);
    }
    default:
      return null;
  }
}

function toValidSelectedYear(value: number | null, now: Date): number | null {
  if (value === null || !Number.isInteger(value)) {
    return null;
  }

  const currentYear = now.getUTCFullYear();
  if (value < LASTFM_FIRST_YEAR || value > currentYear) {
    return null;
  }

  return value;
}

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
  return Buffer.from(buffer).toString("base64");
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

function isStoryPeriod(value: string | null): value is StoryPeriod {
  return (
    value !== null && (ALLOWED_PERIODS as readonly string[]).includes(value)
  );
}

function toSpotifyTimeRange(period: StoryPeriod): SpotifyTimeRange {
  switch (period) {
    case "short_term":
    case "medium_term":
    case "long_term":
      return period;
    case "year":
    case "last_year":
    case "specific_year":
      return "long_term";
    default:
      return "short_term";
  }
}

function getPeriodLabel(period: StoryPeriod, year?: number | null): string {
  if (period === "specific_year" && year) {
    return `Year ${year}`;
  }
  return PERIOD_LABELS[period];
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

    const period: StoryPeriod = isStoryPeriod(periodParam)
      ? periodParam
      : "short_term";
    const template: StoryTemplate = isStoryTemplate(templateParam)
      ? templateParam
      : "top-artists-grid";
    const source = isSource(sourceParam) ? sourceParam : "spotify";
    const now = new Date();
    const yearParam = params.get("year");
    const parsedYear = yearParam === null ? null : Number(yearParam);
    const validSelectedYear = toValidSelectedYear(parsedYear, now);
    const selectedYear =
      period === "specific_year"
        ? (validSelectedYear ?? now.getUTCFullYear())
        : validSelectedYear;
    const storagePeriod =
      period === "specific_year" ? `${period}:${selectedYear}` : period;
    const logoUrl = new URL("/logo.svg", req.nextUrl.origin).toString();

    let normalizedArtists: NormalizedArtist[] = [];
    let topGenres: Array<{ genre: string; count: number }> = [];

    if (source === "lastfm") {
      const username = params.get("username");
      if (!username) {
        return new Response("Missing Last.fm username", { status: 400 });
      }

      const fallbackSpotifyToken = await getServerAccessToken(req);
      const dateRange = getLastFmDateRangeForPeriod(period, selectedYear, now);
      let rawArtists: LastFmArtist[] = [];
      let usedDateRangeFetch = false;

      if (dateRange) {
        try {
          rawArtists = await getTopArtistsByDateRange(username, dateRange);
          usedDateRangeFetch = true;
        } catch (error) {
          console.error(
            "Last.fm weekly artist chart lookup failed, falling back to period chart",
            error,
          );
        }
      }

      if (!usedDateRangeFetch) {
        try {
          const topArtists = await getLastFmTopArtists(
            username,
            LASTFM_PERIODS[period],
          );
          rawArtists = topArtists.topartists.artist;
        } catch (error) {
          console.error("Last.fm period top artists lookup failed", error);
          rawArtists = [];
        }
      }

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

      try {
        const lastFmUser = await upsertLastFmUser(username);

        await saveLastFmPeriodArtists({
          userId: lastFmUser._id,
          username: lastFmUser.username,
          period: storagePeriod,
          artists: normalizedArtists.map((artist) => ({
            artistId: artist.id,
            name: artist.name,
            imageUrl: artist.imageUrl,
            popularity: artist.popularity,
          })),
        });

        await saveArtistsWithoutCover(
          normalizedArtists.slice(0, LASTFM_IMAGE_TILE_LIMIT),
          {
            source: "lastfm",
            firstSeenByUserId: lastFmUser._id,
            firstSeenByUsername: lastFmUser.username,
          },
        );
      } catch (error) {
        console.error("Failed to persist Last.fm usage data", error);
      }
    } else {
      const accessToken = await getServerAccessToken(req);
      if (!accessToken) {
        return new Response("Unauthorized", { status: 401 });
      }

      const spotifyPeriod = toSpotifyTimeRange(period);
      const topArtists = await getTopArtists(spotifyPeriod, accessToken);
      normalizedArtists = topArtists.items.map(normalizeArtist);
      topGenres = getTopGenres(normalizedArtists);
    }

    const topArtist = getTopArtist(normalizedArtists);

    const image = renderTemplate(template, {
      periodLabel: getPeriodLabel(period, selectedYear),
      logoUrl,
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
