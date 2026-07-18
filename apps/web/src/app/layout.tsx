import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { AppHeader } from "../components/AppHeader";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans-loaded",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono-loaded",
});

export const metadata: Metadata = {
  title: "Secret Exposure Response Assistant",
  description:
    "Detect exposed secrets and produce sanitized, prioritized remediation plans.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="app-shell">
        <AppHeader />
        <main className="app-main">{children}</main>
      </body>
    </html>
  );
}
