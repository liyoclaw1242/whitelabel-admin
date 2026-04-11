import { trace, SpanStatusCode, type Span, type Tracer } from "@opentelemetry/api";

const DEFAULT_TRACER_NAME = "@whitelabel/otel";

export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const tracer = trace.getTracer(DEFAULT_TRACER_NAME);
  return traceAsync(tracer, name, async () => fn());
}

export async function traceAsync<T>(
  tracer: Tracer,
  name: string,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.recordException(err as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : String(err),
      });
      throw err;
    } finally {
      span.end();
    }
  });
}
