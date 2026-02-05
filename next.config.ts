import type { NextConfig } from "next";
import nextPwa from "next-pwa";

const withPWA = nextPwa({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline.html",
  },
  runtimeCaching: [
    {
      urlPattern: /\/api\/image\/story/i,
      handler: "CacheFirst",
      options: {
        cacheName: "story-images",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /\/api\/spotify\//i,
      handler: "NetworkFirst",
      options: {
        cacheName: "spotify-api",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 5 * 60,
        },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
};

export default withPWA(nextConfig);
