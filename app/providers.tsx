// app/providers.tsx
"use client";

import { useEffect } from "react";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // COPPA compliance: Use privacy-safe analytics on crossword pages
    // where children are the primary users. Full analytics on other pages.
    const isCrosswordPage =
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/crossword");

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      person_profiles: "identified_only",
      defaults: "2025-05-24",
      // COPPA-safe mode for crossword pages: no persistent identifiers
      ...(isCrosswordPage && {
        disable_persistence: true,
        disable_session_recording: true,
      }),
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
