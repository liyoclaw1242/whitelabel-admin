import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL;

if (!backendUrl) {
  console.warn(
    "⚠ BACKEND_URL is not set — /api/* proxy rewrites will be disabled"
  );
}

const nextConfig: NextConfig = {
  transpilePackages: ["@whitelabel/ui", "@whitelabel/otel"],
  async rewrites() {
    if (!backendUrl) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
