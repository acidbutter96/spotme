import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";
import "./globals.css";
import "./global.scss";
import styles from "./styles.module.scss";

const roboto = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap",
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
    <html lang="en">
      <body className={`${roboto.className} ${styles.body}`}>
        <div className={styles.shell}>
          <header className={styles.header}>
            <div className={`app-container ${styles.headerInner}`}>
              <Link href="/" className={styles.brand}>
                <Image
                  src="/logo.svg"
                  alt="Spotme"
                  width={1227}
                  height={1110}
                  priority
                  className={styles.brandLogo}
                />
                <span className={styles.brandText}>
                  Spotme
                </span>
              </Link>
              <nav className={styles.nav}>
                <Link
                  href="/stories"
                  className={styles.navLink}
                >
                  Stories
                </Link>
              </nav>
            </div>
          </header>
          <div className={styles.main}>{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
