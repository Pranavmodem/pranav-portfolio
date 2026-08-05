import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The portfolio page itself is the Claude Design export served statically
  // from public/index.html (regenerate with design/build-design.py). The app
  // router only provides /api/*, robots.txt, and sitemap.xml.
  async rewrites() {
    return [{ source: "/", destination: "/index.html" }];
  },
};

export default nextConfig;
