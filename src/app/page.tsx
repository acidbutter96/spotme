import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            Spotme
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Turn your Spotify stats into Instagram-ready stories.
          </h1>
          <p className="max-w-2xl text-lg text-white/70">
            Pick a period, choose a template, and export a full-screen 1080x1920
            story in seconds.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/login"
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Connect Spotify
          </Link>
          <Link
            href="/stories"
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/60"
          >
            View Stories
          </Link>
        </div>
      </section>
    </main>
  );
}
