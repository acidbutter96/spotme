import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LoginPanel from "@/components/auth/LoginPanel";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/stories");
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-10">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            Authentication
          </p>
          <h1 className="text-3xl font-semibold">Connect your Spotify</h1>
          <p className="text-white/70">
            We use your listening history to craft story-ready visuals. Your
            tokens stay on the server and never touch local storage.
          </p>
        </div>
        <LoginPanel />
      </div>
    </main>
  );
}
