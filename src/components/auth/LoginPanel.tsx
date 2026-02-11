"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const USERNAME_COOKIE = "lastfm_username";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!match) {
    return null;
  }
  const value = match.slice(`${name}=`.length);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function LoginPanel({
  initialUsername = "",
}: {
  initialUsername?: string;
}) {
  const router = useRouter();
  const [username, setUsername] = useState(() => {
    if (initialUsername) {
      return initialUsername;
    }
    return readCookie(USERNAME_COOKIE) ?? "";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedUsername = useMemo(() => username.trim(), [username]);
  const canContinue = trimmedUsername.length > 0 && !isSubmitting;

  async function handleContinue() {
    if (!trimmedUsername) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/lastfm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: trimmedUsername }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "Failed to save username");
      }

      router.push("/stories");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="app-card p-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Last.fm username</h2>
        <p className="text-sm text-foreground/60">
          We will use your public Last.fm profile to fetch top artists.
        </p>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="e.g. marcospereira"
            autoComplete="username"
            className="app-input"
          />
          <p className="text-xs text-foreground/50">
            This saves a cookie on this device.
          </p>
        </div>

        {error ? <p className="text-sm text-neon-pink">{error}</p> : null}

        <button
          type="button"
          disabled={!canContinue}
          onClick={handleContinue}
          className={`w-full ${canContinue ? "btn-primary" : "btn-disabled"}`}
        >
          {isSubmitting ? "Saving..." : "Continue"}
        </button>

        <p className="text-xs text-foreground/40">
          Spotify sign-in is temporarily disabled.
        </p>
      </div>
    </div>
  );
}
