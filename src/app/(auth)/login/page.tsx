import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginPanel from "@/components/auth/LoginPanel";
import styles from "./styles.module.scss";

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
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>
            Authentication
          </p>
          <h1 className={styles.title}>Continue with Last.fm</h1>
          <p className={styles.description}>
            Spotify sign-in is temporarily disabled. Enter your Last.fm username
            to generate stories from your public profile.
          </p>
        </div>
        <LoginPanel initialUsername={lastFmUsername} />
      </div>
    </main>
  );
}
