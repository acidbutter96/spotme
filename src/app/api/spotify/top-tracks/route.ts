import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerAccessToken } from "@/lib/auth";
import { getTopTracks } from "@/lib/spotify/client";
import { normalizeTrack } from "@/lib/spotify/normalize";
import type { SpotifyTimeRange } from "@/types/spotify";

const ALLOWED_TIME_RANGES: SpotifyTimeRange[] = [
  "short_term",
  "medium_term",
  "long_term",
];

function isSpotifyTimeRange(value: string | null): value is SpotifyTimeRange {
  return (
    value !== null &&
    (ALLOWED_TIME_RANGES as readonly string[]).includes(value)
  );
}

export async function GET(req: NextRequest) {
  try {
    const accessToken = await getServerAccessToken(req);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const timeRange = req.nextUrl.searchParams.get("timeRange");
    const period: SpotifyTimeRange = isSpotifyTimeRange(timeRange)
      ? timeRange
      : "short_term";

    const data = await getTopTracks(period, accessToken);
    const items = data.items.map(normalizeTrack);

    return NextResponse.json({ items });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch top tracks" },
      { status: 500 },
    );
  }
}
