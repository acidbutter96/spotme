import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import StoryPreview from "@/components/stories/StoryPreview";
import { authOptions } from "@/lib/auth";

export default async function StoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            Stories
          </p>
          <h1 className="text-3xl font-semibold">Your Spotify story</h1>
          <p className="text-white/60">
            Select a period and template to generate a shareable story.
          </p>
        </header>
        <StoryPreview />
      </div>
    </main>
  );
}
