import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "lastfm_username";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { username?: unknown }
      | null;

    const username =
      typeof body?.username === "string" ? body.username.trim() : "";

    if (!username) {
      return NextResponse.json({ error: "Missing username" }, { status: 400 });
    }

    if (username.length > 64) {
      return NextResponse.json({ error: "Username is too long" }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: COOKIE_NAME,
      value: encodeURIComponent(username),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to save username" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
