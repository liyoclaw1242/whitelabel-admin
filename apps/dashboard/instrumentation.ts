export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initTracing } = await import("@whitelabel/otel");
    initTracing({
      serviceName: "whitelabel-dashboard",
      environment: process.env.NODE_ENV,
    });
  }
}
