import type { NextAuthOptions } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { refreshSpotifyAccessToken } from "@/lib/spotify/refresh";

const SPOTIFY_SCOPE = "user-top-read user-read-recently-played";

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID ?? "",
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? "",
      authorization: {
        params: { scope: SPOTIFY_SCOPE },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600 * 1000,
        };
      }

      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      return refreshSpotifyAccessToken(token);
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export async function getServerAccessToken(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return null;
  }
  if (token.accessTokenExpires && Date.now() > token.accessTokenExpires) {
    const refreshed = await refreshSpotifyAccessToken(token);
    return refreshed.accessToken ?? null;
  }
  return token.accessToken;
}
