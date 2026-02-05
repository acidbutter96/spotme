import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerAccessToken } from "@/lib/auth";
import { getTopArtists } from "@/lib/spotify/client";
import { normalizeArtist } from "@/lib/spotify/normalize";
import type { SpotifyTimeRange } from "@/types/spotify";

const ALLOWED_TIME_RANGES: SpotifyTimeRange[] = [
  "short_term",
  "medium_term",
  "long_term",
];

export async function GET(req: NextRequest) {
  try {
    const accessToken = await getServerAccessToken(req);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const timeRange = req.nextUrl.searchParams.get("timeRange") as
      | SpotifyTimeRange
      | null;
    const period = ALLOWED_TIME_RANGES.includes(timeRange ?? "")
      ? (timeRange as SpotifyTimeRange)
      : "short_term";

    const data = await getTopArtists(period, accessToken);
    const items = data.items.map(normalizeArtist);

    return NextResponse.json({ items });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch top artists" },
      { status: 500 },
    );
  }
}
