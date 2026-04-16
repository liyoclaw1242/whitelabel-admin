"use client";

import { faro } from "@grafana/faro-web-sdk";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    if (typeof faro !== "undefined" && faro.api?.pushError) {
      faro.api.pushError(error);
    } else {
      console.error(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
