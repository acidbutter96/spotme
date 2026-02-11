import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import StoryPreview from "@/components/stories/StoryPreview";
import { authOptions } from "@/lib/auth";

const LASTFM_USERNAME_COOKIE = "lastfm_username";

function decodeCookieValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function StoriesPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const lastFmUsernameRaw = cookieStore.get(LASTFM_USERNAME_COOKIE)?.value;
  const lastFmUsername = lastFmUsernameRaw
    ? decodeCookieValue(lastFmUsernameRaw)
    : "";

  if (!session && !lastFmUsername) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            Stories
          </p>
          <h1 className="text-3xl font-semibold">Your music story</h1>
          <p className="text-white/60">
            Select a source, period, and template to generate a shareable story.
          </p>
        </header>
        <StoryPreview
          initialSource={session ? "spotify" : "lastfm"}
          initialLastFmUsername={lastFmUsername}
          spotifyEnabled={Boolean(session)}
        />
      </div>
    </main>
  );
}
