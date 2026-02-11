import type { ReactElement } from "react";
import { ArtistPlaceholder } from "@/lib/image/placeholders/artist";

interface TopArtistTemplateProps {
  periodLabel: string;
  logoUrl: string;
  topArtist: {
    name: string;
    imageUrl: string | null;
  } | null;
  topGenres: Array<{ genre: string; count: number }>;
}

export function TopArtistTemplate({
  periodLabel,
  logoUrl,
  topArtist,
  topGenres,
}: TopArtistTemplateProps): ReactElement {
  return (
    <div
      style={{
        width: "1080px",
        height: "1920px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "140px 120px",
        backgroundColor: "#0b0d12",
        color: "#f6f7fb",
        fontFamily: "DM Sans, system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        <p
          style={{
            fontSize: "28px",
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
            fontSize: "96px",
            lineHeight: 1,
            margin: 0,
            fontWeight: 700,
          }}
        >
          Your top artist
        </h1>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "280px",
              height: "280px",
              borderRadius: "48px",
              overflow: "hidden",
              backgroundColor: "#1a1d24",
            }}
          >
            {topArtist?.imageUrl ? (
              <img
                src={topArtist.imageUrl}
                alt={topArtist.name}
                width={280}
                height={280}
                style={{ objectFit: "cover" }}
              />
            ) : (
              <ArtistPlaceholder logoUrl={logoUrl} />
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p
              style={{
                fontSize: "72px",
                fontWeight: 700,
                margin: 0,
              }}
            >
              {topArtist?.name ?? "No top artist yet"}
            </p>
            <p
              style={{
                fontSize: "28px",
                margin: 0,
                color: "rgba(255,255,255,0.65)",
              }}
            >
              {topGenres.length > 0
                ? `Top genres: ${topGenres.map((g) => g.genre).join(", ")}`
                : "Discovering your genres"}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "32px 0 0",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            fontSize: "26px",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                padding: "8px",
                borderRadius: "18px",
                backgroundColor: "rgba(57,255,136,0.12)",
                boxShadow:
                  "0 0 28px rgba(255,59,212,0.45), 0 0 12px rgba(57,255,136,0.35)",
              }}
            >
              <img
                src={logoUrl}
                alt="Music Stories logo"
                width={54}
                height={54}
                style={{ borderRadius: "12px" }}
              />
            </div>
            <span>Generated with spotme.space</span>
          </div>
        </div>
      </div>
    </div>
  );
}
