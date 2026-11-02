import type { NextConfig } from "next";

const longCache = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [
      { source: "/img/:path*", headers: longCache },
      { source: "/video/:path*", headers: longCache },
    ];
  },
};

export default nextConfig;
