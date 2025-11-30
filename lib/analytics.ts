import { track as vercelTrack } from "@vercel/analytics";
import type { PostHog } from "posthog-js";

// Only track events in production (on Vercel)
const isProduction = process.env.NODE_ENV === "production";

type AnalyticsProperties = Record<string, string | number | boolean | null>;

export function trackEvent(
  eventName: string,
  properties: AnalyticsProperties,
  posthog?: PostHog | null
) {
  if (!isProduction) {
    console.log(`[Analytics Dev] ${eventName}`, properties);
    return;
  }

  vercelTrack(eventName, properties);
  posthog?.capture(eventName, properties);
}
