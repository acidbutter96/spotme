import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongo/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const db = await getMongoDb();
    await db.command({ ping: 1 });

    return NextResponse.json({
      ok: true,
      message: "MongoDB connection established",
    });
  } catch (error) {
    console.error("MongoDB connection failed", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to connect to MongoDB",
      },
      { status: 500 },
    );
  }
}
