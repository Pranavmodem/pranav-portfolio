import type { Metadata } from "next";
import "./globals.css";
import { profile } from "@/lib/resume";

export const metadata: Metadata = {
  metadataBase: new URL("https://pranavmodem.com"),
  title: `${profile.name} — ${profile.title}`,
  description: `${profile.name}: ${profile.title}, ${profile.tagline}. ${profile.summary}`,
  openGraph: {
    title: `${profile.name} — ${profile.title}`,
    description: `${profile.tagline}. 8+ years building cloud data platforms and production AI pipelines.`,
    url: "https://pranavmodem.com",
    siteName: profile.name,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `${profile.name} — ${profile.title}`,
    description: `${profile.tagline}. 8+ years building cloud data platforms and production AI pipelines.`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-grid min-h-screen">{children}</body>
    </html>
  );
}
