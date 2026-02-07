import type { ReactElement } from "react";
import { ArtistPlaceholder } from "@/lib/image/placeholders/artist";

interface TopArtistsGridTemplateProps {
  periodLabel: string;
  topArtists: Array<{
    name: string;
    imageUrl: string | null;
  }>;
}

const FALLBACK_TILE_COUNT = 12;
const TILE_SIZE = 260;
const TILE_GAP = 16;
const EXTRA_ROW_GAP = TILE_SIZE + TILE_GAP;

export function TopArtistsGridTemplate({
  periodLabel,
  topArtists,
}: TopArtistsGridTemplateProps): ReactElement {
  const tiles = topArtists.length > 0
    ? topArtists.slice(0, FALLBACK_TILE_COUNT)
    : Array.from({ length: FALLBACK_TILE_COUNT }, () => ({
        name: "Listening...",
        imageUrl: null,
      }));

  return (
    <div
      style={{
        width: "1080px",
        height: "1920px",
        display: "flex",
        flexDirection: "column",
        gap: "64px",
        padding: "120px 120px 96px",
        backgroundColor: "#0b0d12",
        color: "#f6f7fb",
        fontFamily: "DM Sans, system-ui, sans-serif",
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <p
          style={{
            fontSize: "26px",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.55)",
            margin: 0,
          }}
        >
          {periodLabel}
        </p>
        <h1
          style={{
            fontSize: "72px",
            lineHeight: 0.98,
            margin: 0,
            fontWeight: 700,
          }}
        >
          Top artists
        </h1>
      </header>

      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: `${TILE_GAP}px`,
          width: `${TILE_SIZE * 3 + TILE_GAP * 2}px`,
          margin: "0 auto",
        }}
      >
        {tiles.map((artist, index) => (
          <div
            key={`${artist.name}-${index}`}
            style={{
              width: `${TILE_SIZE}px`,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginTop: index >= 6 && index <= 8 ? `${EXTRA_ROW_GAP}px` : 0,
            }}
          >
            <div
              style={{
                width: `${TILE_SIZE}px`,
                height: `${TILE_SIZE}px`,
                display: "flex",
                borderRadius: 0,
                overflow: "hidden",
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            >
              {artist.imageUrl ? (
                <img
                  src={artist.imageUrl}
                  alt={artist.name}
                  width={TILE_SIZE}
                  height={TILE_SIZE}
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <ArtistPlaceholder />
              )}
            </div>
            <p
              style={{
                fontSize: "24px",
                fontWeight: 600,
                margin: 0,
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {artist.name}
            </p>
          </div>
        ))}
      </section>

      <footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingTop: "24px",
          borderTop: "1px solid rgba(255,255,255,0.12)",
          fontSize: "24px",
          color: "rgba(255,255,255,0.6)",
        }}
      >
        <span>Generated with Music Stories</span>
        <span>1080x1920</span>
      </footer>
    </div>
  );
}
