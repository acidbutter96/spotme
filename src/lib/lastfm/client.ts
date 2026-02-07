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

interface LastFmArtist {
  name: string;
  mbid: string;
  playcount: string;
  image: Array<{ "#text": string; size: string }>;
}

interface LastFmArtistInfoResponse {
  artist: {
    name: string;
    mbid: string;
    image: Array<{ "#text": string; size: string }>;
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
  LastFmArtist,
  LastFmArtistInfoResponse,
  LastFmTopArtistsResponse,
};

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
