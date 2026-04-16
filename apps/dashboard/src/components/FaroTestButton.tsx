"use client";

import { useState } from "react";
import { Button } from "@whitelabel/ui";
import { faro, LogLevel } from "@grafana/faro-web-sdk";
import { ActivityIcon } from "lucide-react";

export function FaroTestButton() {
  const [count, setCount] = useState(0);
  if (process.env.NODE_ENV !== "development") return null;

  function send() {
    try {
      faro.api.pushLog([`fe-test-event-${count + 1}`], { level: LogLevel.INFO });
      setCount((c) => c + 1);
    } catch (err) {
      console.warn("[Faro] pushLog failed (likely not initialized)", err);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={send}
      aria-label="Send a test Faro event"
    >
      <ActivityIcon aria-hidden className="mr-2 size-4" />
      Send test event {count > 0 ? `(${count})` : ""}
    </Button>
  );
}
