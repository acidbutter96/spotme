import type { JWT } from "next-auth/jwt";

interface SpotifyRefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export async function refreshSpotifyAccessToken(
  token: JWT,
): Promise<JWT> {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret || !token.refreshToken) {
      return { ...token, error: "MissingRefreshConfig" };
    }

    const credential = `${clientId}:${clientSecret}`;
    const basicAuth =
      typeof Buffer !== "undefined"
        ? Buffer.from(credential).toString("base64")
        : btoa(credential);

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    if (!response.ok) {
      return { ...token, error: "RefreshAccessTokenError" };
    }

    const refreshed: SpotifyRefreshResponse = await response.json();

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}
