"use client";

import { signIn } from "next-auth/react";

export default function LoginPanel() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Spotify login</h2>
        <p className="text-sm text-white/60">
          We request read-only access to your top artists and recently played
          tracks.
        </p>
        <button
          type="button"
          onClick={() => signIn("spotify", { callbackUrl: "/stories" })}
          className="w-full rounded-full bg-[#1DB954] px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
        >
          Continue with Spotify
        </button>
      </div>
    </div>
  );
}
