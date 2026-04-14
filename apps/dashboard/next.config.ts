import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  silent: !process.env.CI,

  widenClientFileUpload: true,

  // Skip source map upload entirely when auth token is missing,
  // so local/dev/CI builds without Sentry credentials still succeed.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
