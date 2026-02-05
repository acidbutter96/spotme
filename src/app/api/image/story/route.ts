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
  short_term: "Last 4 Weeks",
  medium_term: "Last 6 Months",
  long_term: "All Time",
};

const ALLOWED_TEMPLATES: StoryTemplate[] = ["top-artist"];

export async function GET(req: NextRequest) {
  try {
    const accessToken = await getServerAccessToken(req);
    if (!accessToken) {
      return new Response("Unauthorized", { status: 401 });
    }

    const params = req.nextUrl.searchParams;
    const periodParam = params.get("period") as SpotifyTimeRange | null;
    const templateParam = params.get("template") as StoryTemplate | null;

    const period = ALLOWED_TIME_RANGES.includes(periodParam ?? "")
      ? (periodParam as SpotifyTimeRange)
      : "short_term";
    const template = ALLOWED_TEMPLATES.includes(templateParam ?? "")
      ? (templateParam as StoryTemplate)
      : "top-artist";

    const topArtists = await getTopArtists(period, accessToken);
    const normalizedArtists = topArtists.items.map(normalizeArtist);

    const topArtist = getTopArtist(normalizedArtists);
    const topGenres = getTopGenres(normalizedArtists);

    const image = renderTemplate(template, {
      periodLabel: PERIOD_LABELS[period],
      topArtist: topArtist
        ? { name: topArtist.name, imageUrl: topArtist.imageUrl }
        : null,
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
