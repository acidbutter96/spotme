import type { NormalizedArtist, NormalizedTrack } from "@/types/spotify";

export function normalizeArtist(artist: {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  images: Array<{ url: string; width: number | null; height: number | null }>;
}): NormalizedArtist {
  return {
    id: artist.id,
    name: artist.name,
    genres: artist.genres ?? [],
    popularity: artist.popularity ?? 0,
    imageUrl: artist.images?.[0]?.url ?? null,
  };
}

export function normalizeTrack(track: {
  id: string;
  name: string;
  popularity: number;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; width: number | null; height: number | null }>;
  };
}): NormalizedTrack {
  return {
    id: track.id,
    name: track.name,
    popularity: track.popularity ?? 0,
    artists: track.artists?.map((artist) => ({
      id: artist.id,
      name: artist.name,
    })) ?? [],
    album: {
      id: track.album.id,
      name: track.album.name,
      imageUrl: track.album.images?.[0]?.url ?? null,
    },
  };
}
