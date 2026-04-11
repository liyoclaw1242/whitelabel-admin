import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
} from "@opentelemetry/semantic-conventions/incubating";

export interface InitTracingConfig {
  serviceName: string;
  environment?: string;
  serviceVersion?: string;
}

export interface InitTracingResult {
  sdk: NodeSDK | null;
  started: boolean;
  reason?: string;
}

function parseHeaders(raw: string | undefined): Record<string, string> | undefined {
  if (!raw) return undefined;
  const out: Record<string, string> = {};
  for (const pair of raw.split(",")) {
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const key = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (key) out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function initTracing(config: InitTracingConfig): InitTracingResult {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) {
    const reason =
      "OTEL_EXPORTER_OTLP_ENDPOINT not set — tracing disabled";
    console.warn(`[@whitelabel/otel] ${reason}`);
    return { sdk: null, started: false, reason };
  }

  const headers = parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS);

  const exporter = new OTLPTraceExporter({
    url: `${endpoint.replace(/\/$/, "")}/v1/traces`,
    headers,
  });

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: config.serviceName,
    ...(config.serviceVersion && {
      [ATTR_SERVICE_VERSION]: config.serviceVersion,
    }),
    ...(config.environment && {
      [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: config.environment,
    }),
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();

  return { sdk, started: true };
}

export async function shutdownTracing(result: InitTracingResult): Promise<void> {
  if (result.sdk) {
    await result.sdk.shutdown();
  }
}
