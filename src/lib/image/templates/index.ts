import type { ReactElement } from "react";
import { TopArtistTemplate } from "@/lib/image/templates/top-artist";

export type StoryTemplate = "top-artist";

export interface StoryTemplateData {
  periodLabel: string;
  topArtist: {
    name: string;
    imageUrl: string | null;
  } | null;
  topGenres: Array<{ genre: string; count: number }>;
}

export function renderTemplate(
  template: StoryTemplate,
  data: StoryTemplateData,
): ReactElement {
  switch (template) {
    case "top-artist":
      return TopArtistTemplate(data);
    default:
      return TopArtistTemplate(data);
  }
}
