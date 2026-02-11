import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getStoredArtistsWithoutCover } from "@/lib/mongo/service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const limitParam = Number(req.nextUrl.searchParams.get("limit"));
    const limit = Number.isFinite(limitParam)
      ? Math.max(1, Math.min(limitParam, 1000))
      : 200;

    const items = await getStoredArtistsWithoutCover(limit);
    return NextResponse.json({ items, count: items.length });
  } catch (error) {
    console.error("Failed to fetch artists without cover", error);
    return NextResponse.json(
      { error: "Failed to fetch artists without cover" },
      { status: 500 },
    );
  }
}
