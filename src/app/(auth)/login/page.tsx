import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginPanel from "@/components/auth/LoginPanel";

const LASTFM_USERNAME_COOKIE = "lastfm_username";

function decodeCookieValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function LoginPage() {
  const cookieStore = await cookies();
  const lastFmUsernameRaw = cookieStore.get(LASTFM_USERNAME_COOKIE)?.value;
  const lastFmUsername = lastFmUsernameRaw
    ? decodeCookieValue(lastFmUsernameRaw)
    : "";

  if (lastFmUsername) {
    redirect("/stories");
  }

  return (
    <main className="py-12">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-10 px-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-foreground/50">
            Authentication
          </p>
          <h1 className="text-3xl font-semibold">Continue with Last.fm</h1>
          <p className="text-foreground/70">
            Spotify sign-in is temporarily disabled. Enter your Last.fm username
            to generate stories from your public profile.
          </p>
        </div>
        <LoginPanel initialUsername={lastFmUsername} />
      </div>
    </main>
  );
}
