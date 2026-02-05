import type { SpotifyTimeRange } from "@/types/spotify";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

async function spotifyFetch<T>(
  accessToken: string,
  path: string,
): Promise<T> {
  const response = await fetch(`${SPOTIFY_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: { revalidate: 120 },
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getTopArtists(
  timeRange: SpotifyTimeRange,
  accessToken: string,
) {
  return spotifyFetch<SpotifyTopArtistsResponse>(
    accessToken,
    `/me/top/artists?time_range=${timeRange}&limit=50`,
  );
}

export async function getTopTracks(
  timeRange: SpotifyTimeRange,
  accessToken: string,
) {
  return spotifyFetch<SpotifyTopTracksResponse>(
    accessToken,
    `/me/top/tracks?time_range=${timeRange}&limit=50`,
  );
}

export interface SpotifyTopArtistsResponse {
  items: SpotifyArtist[];
}

export interface SpotifyTopTracksResponse {
  items: SpotifyTrack[];
}

interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  images: Array<{ url: string; width: number | null; height: number | null }>;
}

interface SpotifyTrack {
  id: string;
  name: string;
  popularity: number;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; width: number | null; height: number | null }>;
  };
}
