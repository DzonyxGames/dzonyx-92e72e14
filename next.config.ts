import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Dzonyx serves its own trusted cover and page assets. Avoid requiring the
    // optional Cloudflare Images product for the public launch.
    unoptimized: true,
  },
};

export default nextConfig;
