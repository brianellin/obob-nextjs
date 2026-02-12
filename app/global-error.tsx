"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    posthog.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "1rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Something went wrong!</h2>
          <p style={{ color: "#666" }}>An unexpected error occurred.</p>
          <button
            onClick={reset}
            style={{ padding: "0.5rem 1rem", backgroundColor: "#2563eb", color: "white", borderRadius: "0.375rem", border: "none", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
