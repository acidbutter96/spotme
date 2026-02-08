import Link from "next/link";

export default function HomePage() {
  return (
    <main className="py-12">
      <section className="app-container flex flex-col gap-8">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-foreground/50">
            Spotme
          </p>
          <h1 className="bg-gradient-to-r from-neon-pink to-neon-green bg-clip-text text-4xl font-semibold leading-tight text-transparent sm:text-5xl">
            Turn your music stats into Instagram-ready stories.
          </h1>
          <p className="max-w-2xl text-lg text-foreground/70">
            For now, we support Last.fm usernames only (Spotify sign-in is
            temporarily disabled).
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
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
