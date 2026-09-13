import type { Metadata } from "next";
import { Barlow_Condensed, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";

// Display face: Barlow Condensed — an athletic, kit-numbering-adjacent
// condensed sans used widely in real club branding and scoreboards.
const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

// Body face: Inter — quiet, highly legible workhorse for dense dashboard content.
const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

// Utility/mono face: for stats, jersey numbers, timestamps — anything
// that benefits from tabular figures and a "scoreboard" feel.
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Echelon United FC",
  description: "Echelon United FC — player and club management platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-ink font-body text-paper antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
