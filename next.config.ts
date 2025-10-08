import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "images.unsplash.com",
      "upload.wikimedia.org",
      "seeklogo.com",
      "cuvette.tech",
      "assets.norbr.io",
      "encrypted-tbn0.gstatic.com",
      "media.licdn.com",
      "finshiksha.com",
      "www.epaylater.in",
      "www.tatacapital.com",
      "mir-s3-cdn-cf.behance.net",
      "theoracle.xlri.ac.in",
      "cdn.prod.website-files.com",
      "cdn.iconscout.com"
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        // Apply CORS headers to all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, // Allow all origins (or specify: "http://localhost:3000")
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;
