import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAvailableChartYears, LastFmApiError } from "@/lib/lastfm/client";

const MAX_USERNAME_LENGTH = 64;

export async function GET(req: NextRequest) {
  try {
    const username = req.nextUrl.searchParams.get("username")?.trim() ?? "";
    if (!username) {
      return NextResponse.json({ error: "Missing username" }, { status: 400 });
    }

    if (username.length > MAX_USERNAME_LENGTH) {
      return NextResponse.json({ error: "Username is too long" }, { status: 400 });
    }

    const years = await getAvailableChartYears(username);
    return NextResponse.json({ years });
  } catch (error) {
    if (error instanceof LastFmApiError && error.code === 6) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch available years" },
      { status: 500 },
    );
  }
}
