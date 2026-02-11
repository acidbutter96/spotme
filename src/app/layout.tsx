import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Spotme",
  description: "Generate Instagram Stories from your Spotify stats.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#05060a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="min-h-screen text-foreground antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-border bg-background/20 backdrop-blur">
            <div className="app-container flex items-center justify-between py-5">
              <Link href="/" className="group flex items-center gap-3">
                <Image
                  src="/logo.svg"
                  alt="Spotme"
                  width={1227}
                  height={1110}
                  priority
                  className="h-9 w-auto drop-shadow-[0_0_18px_rgba(255,59,212,0.25)]"
                />
                <span className="text-sm font-semibold tracking-wide text-foreground transition group-hover:text-neon-green">
                  Spotme
                </span>
              </Link>
              <nav className="flex items-center gap-3 text-sm text-foreground/70">
                <Link
                  href="/stories"
                  className="rounded-full px-3 py-2 transition hover:text-foreground"
                >
                  Stories
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-border px-4 py-2 transition hover:border-neon-pink/70 hover:text-foreground"
                >
                  Login
                </Link>
              </nav>
            </div>
          </header>
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}
