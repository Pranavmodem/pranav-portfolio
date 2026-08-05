import type { Metadata } from "next";
import "./globals.css";

// The portfolio page itself is served from public/index.html (Claude Design
// export); this layout only wraps app-router routes like the 404 page.
export const metadata: Metadata = {
  metadataBase: new URL("https://pranavmodem.com"),
  title: "Pranav Modem — Big Data Solutions Engineer",
  description:
    "Pranav Modem: Big Data Solutions Engineer at inMarket. Data platforms, AI/ML pipelines, and live AI systems like Alpha Intelligence and ELI5Code.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
