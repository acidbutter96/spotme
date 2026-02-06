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

export default function StoryPreview() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["value"]>(
    "short_term",
  );
  const [template, setTemplate] = useState<
    (typeof TEMPLATES)[number]["value"]
  >("top-artists-grid");
  const [imageError, setImageError] = useState(false);

  const imageUrl = useMemo(() => {
    const params = new URLSearchParams({
      template,
      period,
    });
    return `/api/image/story?${params.toString()}`;
  }, [period, template]);

  return (
    <section className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="space-y-6">
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
          <div className="aspect-[9/16] w-full bg-[#0b0d12]">
            {imageError ? (
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
          <a
            href={imageUrl}
            download={`music-story-${template}-${period}.png`}
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Download Image
          </a>
          <button
            type="button"
            onClick={() => setImageError(false)}
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/70 transition hover:border-white/60"
          >
            Refresh Preview
          </button>
        </div>
      </div>
    </section>
  );
}
