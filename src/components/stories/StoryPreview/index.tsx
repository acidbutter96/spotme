"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.scss";

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
const DEFAULT_YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - FIRST_LASTFM_YEAR + 1 },
  (_, index) => CURRENT_YEAR - index,
);

type Source = (typeof SOURCES)[number]["value"];

function optionButtonClass({
  isActive,
  isDisabled,
}: {
  isActive: boolean;
  isDisabled: boolean;
}) {
  if (isActive) {
    return `${styles.optionButton} ${styles.optionActive}`;
  }
  if (isDisabled) {
    return `${styles.optionButton} ${styles.optionDisabled}`;
  }
  return `${styles.optionButton} ${styles.optionIdle}`;
}

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
  const [template, setTemplate] = useState<(typeof TEMPLATES)[number]["value"]>(
    "top-artists-grid",
  );
  const [imageError, setImageError] = useState(false);
  const [lastFmUsername, setLastFmUsername] = useState(initialLastFmUsername);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [availableYears, setAvailableYears] = useState<number[]>(
    DEFAULT_YEAR_OPTIONS,
  );
  const [isLoadingAvailableYears, setIsLoadingAvailableYears] = useState(false);

  const trimmedUsername = lastFmUsername.trim();
  const yearOptions = source === "lastfm" ? availableYears : DEFAULT_YEAR_OPTIONS;
  const resolvedSelectedYear = yearOptions.includes(selectedYear)
    ? selectedYear
    : (yearOptions[0] ?? selectedYear);
  const canGenerate = source !== "lastfm" || trimmedUsername.length > 0;

  useEffect(() => {
    if (source !== "lastfm" || !trimmedUsername) {
      return;
    }

    const controller = new AbortController();
    setIsLoadingAvailableYears(true);

    void fetch(`/api/lastfm/years?username=${encodeURIComponent(trimmedUsername)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load available years");
        }

        const body = (await response.json()) as { years?: unknown };
        if (!Array.isArray(body.years)) {
          setAvailableYears(DEFAULT_YEAR_OPTIONS);
          return;
        }

        const years = body.years
          .filter((value): value is number => Number.isInteger(value))
          .sort((a, b) => b - a);
        setAvailableYears(years);
      })
      .catch((error: unknown) => {
        if ((error as { name?: string })?.name === "AbortError") {
          return;
        }
        setAvailableYears(DEFAULT_YEAR_OPTIONS);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingAvailableYears(false);
        }
      });

    return () => controller.abort();
  }, [source, trimmedUsername]);

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
      params.set("year", String(resolvedSelectedYear));
    }
    return `/api/image/story?${params.toString()}`;
  }, [period, template, source, trimmedUsername, resolvedSelectedYear]);

  return (
    <section className={styles.root}>
      <div className={`app-card ${styles.sidebar}`}>
        <div className={styles.sidebarInner}>
          <div className={styles.group}>
            <h2 className={styles.groupTitle}>Source</h2>
            <div className={styles.options}>
              {SOURCES.map((option) => {
                const isDisabled = option.value === "spotify" && !spotifyEnabled;
                const isActive = source === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (isDisabled) {
                        return;
                      }
                      if (option.value === "spotify" && !SPOTIFY_PERIODS.has(period)) {
                        setPeriod("short_term");
                      }
                      setSource(option.value);
                      if (option.value !== "lastfm") {
                        setAvailableYears(DEFAULT_YEAR_OPTIONS);
                        setIsLoadingAvailableYears(false);
                      }
                      setImageError(false);
                    }}
                    disabled={isDisabled}
                    className={optionButtonClass({ isActive, isDisabled })}
                  >
                    <span className={styles.optionContent}>
                      {option.value === "lastfm" ? (
                        <img
                          src="/icons/last-fm.svg"
                          alt=""
                          aria-hidden="true"
                          className={styles.optionIcon}
                        />
                      ) : null}
                      <span>{option.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {!spotifyEnabled ? (
              <p className={styles.mutedText}>Spotify preview requires sign-in.</p>
            ) : null}

            {source === "lastfm" ? (
              <div className={styles.field}>
                <label className={styles.label}>Last.fm Username</label>
                <input
                  type="text"
                  value={lastFmUsername}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setLastFmUsername(nextValue);
                    if (!nextValue.trim()) {
                      setAvailableYears(DEFAULT_YEAR_OPTIONS);
                      setIsLoadingAvailableYears(false);
                    }
                    setImageError(false);
                  }}
                  placeholder="Enter your username"
                  className="app-input"
                />
                <p className={styles.helpText}>
                  We will use your public Last.fm profile to pull top artists.
                </p>
              </div>
            ) : null}
          </div>

          <div className={styles.group}>
            <h2 className={styles.groupTitle}>Period</h2>
            <div className={styles.options}>
              {PERIODS.map((option) => {
                const isDisabled = source === "spotify" && !SPOTIFY_PERIODS.has(option.value);
                const isActive = period === option.value;
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
                    className={optionButtonClass({ isActive, isDisabled })}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {period === "specific_year" ? (
              <div className={styles.field}>
                <label className={styles.label}>Year</label>
                <select
                  value={resolvedSelectedYear}
                  onChange={(event) => {
                    setSelectedYear(Number(event.target.value));
                    setImageError(false);
                  }}
                  className="app-input"
                  disabled={
                    source === "lastfm" &&
                    !isLoadingAvailableYears &&
                    yearOptions.length === 0
                  }
                >
                  {yearOptions.length === 0 ? (
                    <option value={selectedYear}>No years available</option>
                  ) : (
                    yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))
                  )}
                </select>

                {source === "lastfm" && isLoadingAvailableYears ? (
                  <p className={styles.mutedText}>Loading available years from Last.fm...</p>
                ) : source === "lastfm" && yearOptions.length === 0 ? (
                  <p className={styles.mutedText}>
                    No scrobble years found for this Last.fm user.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className={styles.group}>
            <h2 className={styles.groupTitle}>Template</h2>
            <div className={styles.options}>
              {TEMPLATES.map((option) => {
                const isActive = template === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setTemplate(option.value);
                      setImageError(false);
                    }}
                    className={optionButtonClass({ isActive, isDisabled: false })}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.preview}>
        <div className={styles.previewCard}>
          <div className={styles.previewFrame}>
            {!canGenerate ? (
              <div className={styles.previewMessage}>
                Enter your Last.fm username to generate a story.
              </div>
            ) : imageError ? (
              <div className={styles.previewMessage}>
                Unable to load story. Try another period.
              </div>
            ) : (
              <img
                key={imageUrl}
                src={imageUrl}
                alt="Story preview"
                className={styles.previewImage}
                onError={() => setImageError(true)}
              />
            )}
          </div>
        </div>

        <div className={styles.actions}>
          {canGenerate ? (
            <a
              href={imageUrl}
              download={`music-story-${source}-${template}-${period}.png`}
              className="btn-primary"
            >
              Download Image
            </a>
          ) : (
            <button type="button" disabled className="btn-disabled">
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
