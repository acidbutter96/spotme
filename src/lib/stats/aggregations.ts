import type { NormalizedArtist } from "@/types/spotify";

export function getTopArtist(artists: NormalizedArtist[]) {
  if (artists.length === 0) {
    return null;
  }
  const [top] = artists;
  return {
    id: top.id,
    name: top.name,
    imageUrl: top.imageUrl,
    genres: top.genres,
    popularity: top.popularity,
  };
}

export function getTopFiveArtists(artists: NormalizedArtist[]) {
  return artists.slice(0, 5).map((artist) => ({
    id: artist.id,
    name: artist.name,
    imageUrl: artist.imageUrl,
  }));
}

export function getTopGenres(artists: NormalizedArtist[]) {
  const counts = new Map<string, number>();

  artists.forEach((artist) => {
    artist.genres.forEach((genre) => {
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
