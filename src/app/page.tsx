import Link from "next/link";
import styles from "./styles.module.scss";

const PLATFORM_FEATURES = [
  {
    title: "Last.fm-first access",
    description:
      "Create stories from any public Last.fm profile right away without requiring OAuth setup.",
  },
  {
    title: "Rich period filters",
    description:
      "Switch between week, month, 6 months, year, specific year, and all-time ranges to match your recap style.",
  },
  {
    title: "Template options",
    description:
      "Choose between focused and grid-based layouts to highlight one artist or your full top list.",
  },
  {
    title: "Live preview + PNG export",
    description:
      "Generate a preview in-app, refresh instantly, and download a high-resolution story image in one click.",
  },
] as const;

const STORY_FLOW = [
  "Choose your source and set the time range.",
  "Pick a story template and review the generated preview.",
  "Download the final PNG and post it to Instagram stories.",
] as const;

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={`app-container ${styles.homeSection}`}>
        <div className={styles.hero}>
          <div className={styles.homeIntro}>
            <p className={styles.eyebrow}>
              Spotme
            </p>
            <h1 className={styles.homeTitle}>
              Turn your music stats into Instagram-ready stories.
            </h1>
            <p className={styles.homeDescription}>
              Spotme is a music recap platform that converts your listening history into
              clean, shareable story designs. Select your source, configure the period,
              choose a layout, and export instantly.
            </p>
            <p className={styles.homeDescription}>
              You can currently generate stories with any public Last.fm username while
              Spotify sign-in remains temporarily disabled.
            </p>
            <div className={styles.homeActions}>
              <Link href="/login" className="btn-primary">
                Continue with Last.fm
              </Link>
              <Link href="/stories" className="btn-secondary">
                View Stories
              </Link>
            </div>
          </div>
          <aside className={`app-card ${styles.heroCard}`}>
            <p className={styles.heroCardLabel}>What you can do</p>
            <ul className={styles.heroCardList}>
              <li>Build artist recaps from public listening data.</li>
              <li>Compare weekly, monthly, yearly, or all-time trends.</li>
              <li>Export story images ready for social sharing.</li>
            </ul>
          </aside>
        </div>

        <section
          aria-labelledby="platform-features-title"
          className={styles.featuresSection}
        >
          <p className={styles.sectionEyebrow}>Platform features</p>
          <h2 id="platform-features-title" className={styles.featuresTitle}>
            Everything you need to create polished music story cards.
          </h2>
          <div className={styles.featuresGrid}>
            {PLATFORM_FEATURES.map((feature) => (
              <article key={feature.title} className={`app-card ${styles.featureCard}`}>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="story-flow-title" className={`app-card ${styles.flowSection}`}>
          <p className={styles.sectionEyebrow}>How it works</p>
          <h2 id="story-flow-title" className={styles.flowTitle}>
            Create your story in three steps
          </h2>
          <ol className={styles.flowList}>
            {STORY_FLOW.map((step, index) => (
              <li key={step} className={styles.flowItem}>
                <span className={styles.flowStep}>{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </section>
    </main>
  );
}
