import Link from "next/link";
import styles from "./styles.module.scss";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={`app-container ${styles.homeSection}`}>
        <div className={styles.homeIntro}>
          <p className={styles.eyebrow}>
            Spotme
          </p>
          <h1 className={styles.homeTitle}>
            Turn your music stats into Instagram-ready stories.
          </h1>
          <p className={styles.homeDescription}>
            For now, we support Last.fm usernames only (Spotify sign-in is
            temporarily disabled).
          </p>
        </div>
        <div className={styles.homeActions}>
          <Link href="/login" className="btn-primary">
            Continue with Last.fm
          </Link>
          <Link href="/stories" className="btn-secondary">
            View Stories
          </Link>
        </div>
      </section>
    </main>
  );
}
