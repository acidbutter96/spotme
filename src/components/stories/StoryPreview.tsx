"use client";

import { useMemo, useState } from "react";

const PERIODS = [
  { value: "week", label: "This week" },
  { value: "15days", label: "Last 15 days" },
  { value: "30days", label: "Last 30 days" },
  { value: "short_term", label: "This month" },
  { value: "medium_term", label: "Last 6 months" },
  { value: "year", label: "This year" },
  { value: "last_year", label: "Last year" },
  { value: "specific_year", label: "Specific year" },
  { value: "long_term", label: "All time" },
] as const;

const TEMPLATES = [
  { value: "top-artists-grid", label: "Top Artists Grid" },
  { value: "top-artist", label: "Top Artist" },
] as const;

const SOURCES = [
  { value: "spotify", label: "Spotify" },
  { value: "lastfm", label: "Last.fm" },
] as const;

const SPOTIFY_PERIODS = new Set(["short_term", "medium_term", "long_term"]);
const CURRENT_YEAR = new Date().getFullYear();
const FIRST_LASTFM_YEAR = 2002;
const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - FIRST_LASTFM_YEAR + 1 },
  (_, index) => CURRENT_YEAR - index,
);

type Source = (typeof SOURCES)[number]["value"];

export default function StoryPreview({
  initialSource = "spotify",
  initialLastFmUsername = "",
  spotifyEnabled = true,
}: {
  initialSource?: Source;
  initialLastFmUsername?: string;
  spotifyEnabled?: boolean;
}) {
  const resolvedInitialSource: Source =
    initialSource === "spotify" && !spotifyEnabled ? "lastfm" : initialSource;

  const [source, setSource] = useState<Source>(resolvedInitialSource);
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["value"]>(
    "short_term",
  );
  const [template, setTemplate] = useState<
    (typeof TEMPLATES)[number]["value"]
  >("top-artists-grid");
  const [imageError, setImageError] = useState(false);
  const [lastFmUsername, setLastFmUsername] = useState(initialLastFmUsername);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  const trimmedUsername = lastFmUsername.trim();
  const canGenerate = source !== "lastfm" || trimmedUsername.length > 0;

  const imageUrl = useMemo(() => {
    const params = new URLSearchParams({
      template,
      period,
      source,
    });
    if (source === "lastfm" && trimmedUsername) {
      params.set("username", trimmedUsername);
    }
    if (period === "specific_year") {
      params.set("year", String(selectedYear));
    }
    return `/api/image/story?${params.toString()}`;
  }, [period, template, source, trimmedUsername, selectedYear]);

  return (
    <section className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <div className="app-card p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground/60">
              Source
            </h2>
            <div className="flex flex-col gap-2">
              {SOURCES.map((option) => {
                const isDisabled = option.value === "spotify" && !spotifyEnabled;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (isDisabled) {
                        return;
                      }
                      if (
                        option.value === "spotify" &&
                        !SPOTIFY_PERIODS.has(period)
                      ) {
                        setPeriod("short_term");
                      }
                      setSource(option.value);
                      setImageError(false);
                    }}
                    disabled={isDisabled}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      source === option.value
                        ? "border-transparent bg-gradient-to-r from-neon-pink to-neon-green text-black shadow-neon hover:brightness-110"
                        : isDisabled
                          ? "cursor-not-allowed border-border bg-transparent text-foreground/30"
                          : "border-border bg-transparent text-foreground/70 hover:border-neon-pink/70"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {option.value === "lastfm" ? (
                        <img
                          src="/icons/last-fm.svg"
                          alt=""
                          aria-hidden="true"
                          className="h-4 w-4"
                        />
                      ) : null}
                      <span>{option.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {!spotifyEnabled ? (
              <p className="text-xs text-foreground/40">
                Spotify preview requires sign-in.
              </p>
            ) : null}
            {source === "lastfm" ? (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50">
                  Last.fm Username
                </label>
                <input
                  type="text"
                  value={lastFmUsername}
                  onChange={(event) => {
                    setLastFmUsername(event.target.value);
                    setImageError(false);
                  }}
                  placeholder="Enter your username"
                  className="app-input"
                />
                <p className="text-xs text-foreground/50">
                  We will use your public Last.fm profile to pull top artists.
                </p>
              </div>
            ) : null}
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground/60">
              Period
            </h2>
            <div className="flex flex-col gap-2">
              {PERIODS.map((option) => {
                const isDisabled =
                  source === "spotify" && !SPOTIFY_PERIODS.has(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (isDisabled) {
                        return;
                      }
                      setPeriod(option.value);
                      setImageError(false);
                    }}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      period === option.value
                        ? "border-transparent bg-gradient-to-r from-neon-pink to-neon-green text-black shadow-neon hover:brightness-110"
                        : isDisabled
                          ? "cursor-not-allowed border-border bg-transparent text-foreground/30"
                          : "border-border bg-transparent text-foreground/70 hover:border-neon-pink/70"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {period === "specific_year" ? (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(event) => {
                    setSelectedYear(Number(event.target.value));
                    setImageError(false);
                  }}
                  className="app-input"
                >
                  {YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground/60">
              Template
            </h2>
            <div className="flex flex-col gap-2">
              {TEMPLATES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setTemplate(option.value);
                    setImageError(false);
                  }}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    template === option.value
                      ? "border-transparent bg-gradient-to-r from-neon-pink to-neon-green text-black shadow-neon hover:brightness-110"
                      : "border-border bg-transparent text-foreground/70 hover:border-neon-pink/70"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-black/40 shadow-soft">
          <div className="aspect-9/16 w-full bg-background">
            {!canGenerate ? (
              <div className="flex h-full items-center justify-center text-sm text-foreground/60">
                Enter your Last.fm username to generate a story.
              </div>
            ) : imageError ? (
              <div className="flex h-full items-center justify-center text-sm text-foreground/60">
                Unable to load story. Try another period.
              </div>
            ) : (
              <img
                key={imageUrl}
                src={imageUrl}
                alt="Story preview"
                className="h-full w-full object-cover"
                onError={() => setImageError(true)}
              />
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {canGenerate ? (
            <a
              href={imageUrl}
              download={`music-story-${source}-${template}-${period}.png`}
              className="btn-primary"
            >
              Download Image
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="btn-disabled"
            >
              Download Image
            </button>
          )}
          <button
            type="button"
            onClick={() => setImageError(false)}
            disabled={!canGenerate}
            className={canGenerate ? "btn-secondary" : "btn-disabled"}
          >
            Refresh Preview
          </button>
        </div>
      </div>
    </section>
  );
}
