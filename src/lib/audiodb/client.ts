const AUDIODB_API_BASE = "https://www.theaudiodb.com/api/v1/json";
const DEFAULT_AUDIODB_KEY = "2";

interface AudioDbArtist {
  strArtist: string | null;
  strArtistThumb: string | null;
  strArtistWideThumb: string | null;
  strArtistFanart: string | null;
  strArtistFanart2: string | null;
  strArtistFanart3: string | null;
  strArtistCutout: string | null;
  strArtistClearart: string | null;
  strArtistLogo: string | null;
  strArtistBanner: string | null;
}

interface AudioDbArtistsResponse {
  artists: AudioDbArtist[] | null;
}

async function audioDbFetch<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const apiKey = process.env.AUDIODB_API_KEY || DEFAULT_AUDIODB_KEY;
  const searchParams = new URLSearchParams(params);
  const response = await fetch(
    `${AUDIODB_API_BASE}/${apiKey}/${path}?${searchParams.toString()}`,
    {
      next: { revalidate: 6 * 60 * 60 },
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; MusicStoriesBot/1.0; +http://127.0.0.1)",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`TheAudioDB API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function normalizeImageUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
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

function pickBestArtistImage(artist: AudioDbArtist): string | null {
  const candidates = [
    artist.strArtistThumb,
    artist.strArtistWideThumb,
    artist.strArtistFanart,
    artist.strArtistFanart2,
    artist.strArtistFanart3,
    artist.strArtistCutout,
    artist.strArtistClearart,
    artist.strArtistLogo,
    artist.strArtistBanner,
  ]
    .map(normalizeImageUrl)
    .filter((url): url is string => Boolean(url));

  return candidates[0] ?? null;
}

export async function getAudioDbArtistImage(input: {
  name?: string;
  mbid?: string;
}): Promise<string | null> {
  if (!input.mbid && !input.name) {
    return null;
  }

  if (input.mbid) {
    const response = await audioDbFetch<AudioDbArtistsResponse>("artist-mb.php", {
      i: input.mbid,
    });
    const artist = response.artists?.[0];
    if (artist) {
      const image = pickBestArtistImage(artist);
      if (image) {
        return image;
      }
    }
  }

  if (input.name) {
    const response = await audioDbFetch<AudioDbArtistsResponse>("search.php", {
      s: input.name,
    });
    const artist = response.artists?.[0];
    if (artist) {
      return pickBestArtistImage(artist);
    }
  }

  return null;
}
