import type { NextConfig } from "next";
import { SITE } from "./lib/site";

const longCache = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  // /review is what the review QR codes open. Temporary (307), so browsers don't cache it and the target can change.
  async redirects() {
    return [{ source: "/review", destination: SITE.review, permanent: false }];
  },
  async headers() {
    return [
      { source: "/img/:path*", headers: longCache },
      { source: "/video/:path*", headers: longCache },
    ];
  },
};

export default nextConfig;
