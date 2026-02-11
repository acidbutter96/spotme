import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import StoryPreview from "@/components/stories/StoryPreview";
import { authOptions } from "@/lib/auth";
import styles from "./styles.module.scss";

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
    <main className={styles.page}>
      <div className={`app-container ${styles.container}`}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>
            Stories
          </p>
          <h1 className={styles.title}>Your music story</h1>
          <p className={styles.description}>
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
