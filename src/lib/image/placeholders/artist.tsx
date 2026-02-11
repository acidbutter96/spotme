import type { ReactElement } from "react";

type ArtistPlaceholderProps = {
  size?: number;
  logoUrl?: string;
};

export function ArtistPlaceholder({
  size = 100,
  logoUrl = "/logo.svg",
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
          <stop offset="0" stopColor="#2a0f2b" />
          <stop offset="1" stopColor="#0b0d12" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="45%" r="70%">
          <stop offset="0" stopColor="#ff3bd4" stopOpacity="0.46" />
          <stop offset="0.65" stopColor="#39ff88" stopOpacity="0.18" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="100" height="100" fill="url(#bg)" />
      <rect x="0" y="0" width="100" height="100" fill="url(#glow)" />

      <image
        href={logoUrl}
        x="0"
        y="0"
        width="100"
        height="100"
        preserveAspectRatio="xMidYMid slice"
      />

      <rect x="0" y="0" width="100" height="100" fill="url(#glow)" opacity="0.7" />
      <rect x="1" y="1" width="98" height="98" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
    </svg>
  );
}
