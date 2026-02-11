"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import styles from "./styles.module.scss";

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
    <div className={`app-card ${styles.root}`}>
      <div className={styles.content}>
        <div className={styles.intro}>
          <h2 className={styles.title}>Last.fm username</h2>
          <p className={styles.subtitle}>
            We will use your public Last.fm profile to fetch top artists.
          </p>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="e.g. marcospereira"
            autoComplete="username"
            className="app-input"
          />
          <p className={styles.helpText}>This saves a cookie on this device.</p>
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <button
          type="button"
          disabled={!canContinue}
          onClick={handleContinue}
          className={`${styles.submit} ${canContinue ? "btn-primary" : "btn-disabled"}`}
        >
          {isSubmitting ? "Saving..." : "Continue"}
        </button>

        <p className={styles.notice}>Spotify sign-in is temporarily disabled.</p>
      </div>
    </div>
  );
}
