import type { ReactElement } from "react";
import { TopArtistTemplate } from "@/lib/image/templates/top-artist";
import { TopArtistsGridTemplate } from "@/lib/image/templates/top-artists-grid";

export type StoryTemplate = "top-artist" | "top-artists-grid";

export interface StoryTemplateData {
  periodLabel: string;
  topArtist: {
    name: string;
    imageUrl: string | null;
  } | null;
  topArtists: Array<{
    name: string;
    imageUrl: string | null;
  }>;
  topGenres: Array<{ genre: string; count: number }>;
}

export function renderTemplate(
  template: StoryTemplate,
  data: StoryTemplateData,
): ReactElement {
  switch (template) {
    case "top-artist":
      return TopArtistTemplate(data);
    case "top-artists-grid":
      return TopArtistsGridTemplate(data);
    default:
      return TopArtistsGridTemplate(data);
  }
}
