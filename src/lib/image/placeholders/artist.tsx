import type { ReactElement } from "react";

type ArtistPlaceholderProps = {
  size?: number;
};

export function ArtistPlaceholder({
  size = 100,
}: ArtistPlaceholderProps): ReactElement {
  const px = `${size}px`;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Artist image placeholder"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a1b2a" />
          <stop offset="1" stopColor="#0b0d12" />
        </linearGradient>
        <radialGradient id="glow" cx="30%" cy="25%" r="70%">
          <stop offset="0" stopColor="#d51007" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="star" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d51007" stopOpacity="0.95" />
          <stop offset="1" stopColor="#d51007" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="100" height="100" fill="url(#bg)" />
      <rect x="0" y="0" width="100" height="100" fill="url(#glow)" />

      {/* A simple "Last.fm star" mark to keep the brand vibe when images are missing. */}
      <g opacity="0.92">
        <path
          d="M50 18 L58.8 35.8 L78.4 38.6 L64.2 52.4 L67.6 72 L50 62.8 L32.4 72 L35.8 52.4 L21.6 38.6 L41.2 35.8 Z"
          fill="url(#star)"
        />
        <path
          d="M50 22 L57.6 37.4 L74.6 39.8 L62.3 51.8 L65.2 68.6 L50 60.6 L34.8 68.6 L37.7 51.8 L25.4 39.8 L42.4 37.4 Z"
          fill="#ffffff"
          opacity="0.1"
        />
      </g>

      <g
        opacity="0.5"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M20 82 C26 76, 30 76, 36 82" fill="none" />
        <path d="M38 82 C44 72, 50 72, 56 82" fill="none" />
        <path d="M58 82 C64 76, 68 76, 74 82" fill="none" />
        <path d="M76 82 C82 78, 86 78, 92 82" fill="none" />
      </g>
    </svg>
  );
}
