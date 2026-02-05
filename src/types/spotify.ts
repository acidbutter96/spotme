export type SpotifyTimeRange = "short_term" | "medium_term" | "long_term";

export interface NormalizedSpotifyImage {
  url: string | null;
  width: number | null;
  height: number | null;
}

export interface NormalizedArtist {
  id: string;
  name: string;
  genres: string[];
  imageUrl: string | null;
  popularity: number;
}

export interface NormalizedTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
  popularity: number;
}
