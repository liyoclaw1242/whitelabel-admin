import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  transpilePackages: ["@whitelabel/ui", "@whitelabel/otel"],
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
