import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";
import { getServerAccessToken } from "@/lib/auth";
import { getTopArtists } from "@/lib/spotify/client";
import { normalizeArtist } from "@/lib/spotify/normalize";
import { getTopArtist, getTopGenres } from "@/lib/stats/aggregations";
import { renderTemplate } from "@/lib/image/templates";
import type { SpotifyTimeRange } from "@/types/spotify";
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

export async function GET(req: NextRequest) {
  try {
    const accessToken = await getServerAccessToken(req);
    if (!accessToken) {
      return new Response("Unauthorized", { status: 401 });
    }

    const params = req.nextUrl.searchParams;
    const periodParam = params.get("period");
    const templateParam = params.get("template");

    const period: SpotifyTimeRange = isSpotifyTimeRange(periodParam)
      ? periodParam
      : "short_term";
    const template: StoryTemplate = isStoryTemplate(templateParam)
      ? templateParam
      : "top-artists-grid";

    const topArtists = await getTopArtists(period, accessToken);
    const normalizedArtists = topArtists.items.map(normalizeArtist);

    const topArtist = getTopArtist(normalizedArtists);
    const topGenres = getTopGenres(normalizedArtists);

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
