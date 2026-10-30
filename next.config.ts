import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    qualities: [75, 90],
  },
  experimental: {
    agentUpgrade: "security",
  },
  // The public test link is an ngrok hostname. Next.js dev rejects that host
  // unless it is listed here. The hostname changes; the patterns do not.
  allowedDevOrigins: [
    "*.ngrok.app",
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.ngrok.dev",
    "*.ngrok-free.dev",
  ],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      {
        source: "/researcher/completed",
        destination: "/researcher/projects",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
