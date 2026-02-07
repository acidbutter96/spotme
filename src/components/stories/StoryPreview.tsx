"use client";

import { useMemo, useState } from "react";

const PERIODS = [
  { value: "short_term", label: "This month" },
  { value: "medium_term", label: "Last 6 months" },
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
    return `/api/image/story?${params.toString()}`;
  }, [period, template, source, trimmedUsername]);

  return (
    <section className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
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
                    setSource(option.value);
                    setImageError(false);
                  }}
                  disabled={isDisabled}
                  className={`rounded-2xl px-4 py-3 text-left text-sm transition ${
                    source === option.value
                      ? "bg-white text-black"
                      : isDisabled
                        ? "cursor-not-allowed border border-white/10 bg-transparent text-white/30"
                        : "border border-white/10 bg-transparent text-white/70 hover:border-white/40"
                  }`}
                >
                  {option.label}
                </button>
                );
              })}
            </div>
            {!spotifyEnabled ? (
              <p className="text-xs text-white/40">
                Spotify preview requires sign-in.
              </p>
            ) : null}
            {source === "lastfm" ? (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
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
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                />
                <p className="text-xs text-white/50">
                  We will use your public Last.fm profile to pull top artists.
                </p>
              </div>
            ) : null}
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
              Period
            </h2>
            <div className="flex flex-col gap-2">
              {PERIODS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setPeriod(option.value);
                    setImageError(false);
                  }}
                  className={`rounded-2xl px-4 py-3 text-left text-sm transition ${
                    period === option.value
                      ? "bg-white text-black"
                      : "border border-white/10 bg-transparent text-white/70 hover:border-white/40"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
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
                  className={`rounded-2xl px-4 py-3 text-left text-sm transition ${
                    template === option.value
                      ? "bg-white text-black"
                      : "border border-white/10 bg-transparent text-white/70 hover:border-white/40"
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
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black">
          <div className="aspect-9/16 w-full bg-[#0b0d12]">
            {!canGenerate ? (
              <div className="flex h-full items-center justify-center text-sm text-white/60">
                Enter your Last.fm username to generate a story.
              </div>
            ) : imageError ? (
              <div className="flex h-full items-center justify-center text-sm text-white/60">
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
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Download Image
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-full bg-white/40 px-6 py-3 text-sm font-semibold text-black/60"
            >
              Download Image
            </button>
          )}
          <button
            type="button"
            onClick={() => setImageError(false)}
            disabled={!canGenerate}
            className={`rounded-full border px-6 py-3 text-sm font-semibold transition ${
              canGenerate
                ? "border-white/20 text-white/70 hover:border-white/60"
                : "cursor-not-allowed border-white/10 text-white/30"
            }`}
          >
            Refresh Preview
          </button>
        </div>
      </div>
    </section>
  );
}
