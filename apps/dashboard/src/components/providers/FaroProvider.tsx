"use client";

import { useEffect, type ReactNode } from "react";
import { initializeFaro, getWebInstrumentations } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";

let faroInitialized = false;

export interface FaroProviderProps {
  children: ReactNode;
}

export function FaroProvider({ children }: FaroProviderProps) {
  useEffect(() => {
    if (faroInitialized) return;
    const url = process.env.NEXT_PUBLIC_GRAFANA_FARO_URL;
    if (!url) {
      console.warn(
        "[Faro] NEXT_PUBLIC_GRAFANA_FARO_URL not set — frontend telemetry disabled.",
      );
      faroInitialized = true;
      return;
    }
    try {
      initializeFaro({
        url,
        app: {
          name: "whitelabel-dashboard",
          version: APP_VERSION,
          environment: process.env.NODE_ENV,
        },
        instrumentations: [
          ...getWebInstrumentations(),
          new TracingInstrumentation(),
        ],
      });
      faroInitialized = true;
    } catch (err) {
      console.warn("[Faro] init failed", err);
      faroInitialized = true;
    }
  }, []);

  return <>{children}</>;
}
