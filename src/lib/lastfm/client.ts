const LASTFM_API_BASE = "https://ws.audioscrobbler.com/2.0/";
const LASTFM_PLACEHOLDER_HASHES = [
  "2a96cbd8b46e442fc41c2b86b821562f",
  "c6f59c1e5e7240a4c0d427abd71f3dbb",
];

export type LastFmPeriod =
  | "7day"
  | "1month"
  | "3month"
  | "6month"
  | "12month"
  | "overall";

interface LastFmTopArtistsResponse {
  topartists: {
    artist: LastFmArtist[];
  };
}

interface LastFmWeeklyArtistChartResponse {
  weeklyartistchart?: {
    artist?: LastFmWeeklyArtistChartArtist[] | LastFmWeeklyArtistChartArtist;
  };
}

interface LastFmWeeklyChartListResponse {
  weeklychartlist?: {
    chart?: LastFmWeeklyChartListEntry[] | LastFmWeeklyChartListEntry;
  };
}

interface LastFmWeeklyArtistChartArtist {
  name?: string;
  "#text"?: string;
  mbid?: string;
  playcount?: string | number;
}

interface LastFmWeeklyChartListEntry {
  from?: string;
  to?: string;
}

interface LastFmArtistImage {
  "#text": string;
  size: string;
}

interface LastFmArtist {
  name: string;
  mbid: string;
  playcount: string;
  image: LastFmArtistImage[];
}

interface LastFmArtistInfoResponse {
  artist: {
    name: string;
    mbid: string;
    image: LastFmArtistImage[];
  };
}

interface LastFmErrorResponse {
  error: number;
  message: string;
}

export class LastFmApiError extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(`Last.fm API error: ${message}`);
    this.name = "LastFmApiError";
    this.code = code;
  }
}

function isLastFmError(data: unknown): data is LastFmErrorResponse {
  if (!data || typeof data !== "object") {
    return false;
  }
  return "error" in data && "message" in data;
}

async function lastFmFetch<T>(params: Record<string, string>) {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) {
    throw new Error("Missing LASTFM_API_KEY");
  }

  const searchParams = new URLSearchParams({
    ...params,
    api_key: apiKey,
    format: "json",
  });

  const response = await fetch(
    `${LASTFM_API_BASE}?${searchParams.toString()}`,
    {
      next: { revalidate: 120 },
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; MusicStoriesBot/1.0; +http://127.0.0.1)",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Last.fm API error: ${response.status}`);
  }

  const data = (await response.json()) as unknown;
  if (isLastFmError(data)) {
    throw new LastFmApiError(data.error, data.message);
  }

  return data as T;
}

export async function getTopArtists(
  username: string,
  period: LastFmPeriod,
): Promise<LastFmTopArtistsResponse> {
  return lastFmFetch<LastFmTopArtistsResponse>({
    method: "user.gettopartists",
    user: username,
    period,
    limit: "50",
    autocorrect: "1",
  });
}

export async function getTopArtistsByDateRange(
  username: string,
  input: { from: number; to: number; limit?: number },
): Promise<LastFmArtist[]> {
  const response = await lastFmFetch<LastFmWeeklyArtistChartResponse>({
    method: "user.getweeklyartistchart",
    user: username,
    from: String(input.from),
    to: String(input.to),
    limit: String(input.limit ?? 50),
    autocorrect: "1",
  });

  const artists = response.weeklyartistchart?.artist;
  if (!artists) {
    return [];
  }

  const normalized = (Array.isArray(artists) ? artists : [artists])
    .map(normalizeWeeklyChartArtist)
    .filter((artist): artist is LastFmArtist => Boolean(artist));

  return normalized;
}

export async function getAvailableChartYears(
  username: string,
): Promise<number[]> {
  const response = await lastFmFetch<LastFmWeeklyChartListResponse>({
    method: "user.getweeklychartlist",
    user: username,
    autocorrect: "1",
  });

  const chart = response.weeklychartlist?.chart;
  if (!chart) {
    return [];
  }

  const entries = Array.isArray(chart) ? chart : [chart];
  const years = new Set<number>();

  for (const entry of entries) {
    const fromSeconds = Number(entry.from);
    if (Number.isFinite(fromSeconds) && fromSeconds > 0) {
      years.add(new Date(fromSeconds * 1000).getUTCFullYear());
    }

    const toSeconds = Number(entry.to);
    if (Number.isFinite(toSeconds) && toSeconds > 0) {
      years.add(new Date(toSeconds * 1000).getUTCFullYear());
    }
  }

  return Array.from(years).sort((a, b) => b - a);
}

export async function getArtistInfo(input: {
  name?: string;
  mbid?: string;
}): Promise<LastFmArtistInfoResponse> {
  if (!input.mbid && !input.name) {
    throw new Error("Artist info requires a name or mbid");
  }

  return lastFmFetch<LastFmArtistInfoResponse>({
    method: "artist.getinfo",
    ...(input.mbid ? { mbid: input.mbid } : { artist: input.name ?? "" }),
    autocorrect: "1",
  });
}

export function getBestArtistImage(
  images: Array<{ "#text": string; size: string }>,
): string | null {
  const normalized = images
    .map((entry) => ({
      size: entry.size,
      url: normalizeLastFmImageUrl(entry["#text"]),
    }))
    .filter((entry): entry is { size: string; url: string } => Boolean(entry.url))
    .filter((entry) => !isLastFmPlaceholder(entry.url));

  if (normalized.length === 0) {
    return null;
  }

  const preferredSizeOrder = [
    "mega",
    "extralarge",
    "large",
    "medium",
    "small",
  ];

  for (const size of preferredSizeOrder) {
    const match = normalized.find((entry) => entry.size === size);
    if (match) {
      return match.url;
    }
  }

  return normalized[0]?.url ?? null;
}

export type {
  LastFmArtistImage,
  LastFmArtist,
  LastFmArtistInfoResponse,
  LastFmTopArtistsResponse,
};

function normalizeWeeklyChartArtist(
  input: LastFmWeeklyArtistChartArtist,
): LastFmArtist | null {
  const rawName =
    typeof input.name === "string"
      ? input.name
      : typeof input["#text"] === "string"
        ? input["#text"]
        : "";
  const name = rawName.trim();
  if (!name) {
    return null;
  }

  return {
    name,
    mbid: typeof input.mbid === "string" ? input.mbid : "",
    playcount:
      typeof input.playcount === "number"
        ? String(input.playcount)
        : typeof input.playcount === "string"
          ? input.playcount
          : "0",
    image: [],
  };
}

function normalizeLastFmImageUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  if (trimmed.startsWith("http://")) {
    return `https://${trimmed.slice("http://".length)}`;
  }
  return trimmed;
}

function isLastFmPlaceholder(url: string): boolean {
  if (url.includes("/noimage/")) {
    return true;
  }
  return LASTFM_PLACEHOLDER_HASHES.some((hash) => url.includes(hash));
}
