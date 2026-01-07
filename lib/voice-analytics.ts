import { track as vercelTrack } from "@vercel/analytics";
import type { PostHog } from "posthog-js";

const isProduction = process.env.NODE_ENV === "production";

export interface VoiceAnalyticsContext {
  roomName: string;
  participantName: string;
  playerCount: number;
}

type EventProperties = Record<string, string | number | boolean | null | undefined>;

function trackEvent(
  eventName: string,
  properties: EventProperties,
  posthog?: PostHog | null
) {
  const cleanProperties = Object.fromEntries(
    Object.entries(properties).filter(([, v]) => v !== undefined)
  ) as Record<string, string | number | boolean | null>;

  if (!isProduction) {
    console.log(`[Voice Analytics Dev] ${eventName}`, cleanProperties);
    return;
  }

  vercelTrack(eventName, cleanProperties);
  posthog?.capture(eventName, cleanProperties);
}

function getCommonProperties(ctx: VoiceAnalyticsContext) {
  return {
    roomName: ctx.roomName,
    participantName: ctx.participantName,
    playerCount: ctx.playerCount,
  };
}

// Dialog shown to user
export function trackVoiceDialogShown(
  ctx: VoiceAnalyticsContext,
  trigger: "auto" | "manual",
  posthog?: PostHog | null
) {
  trackEvent(
    "voiceDialogShown",
    { ...getCommonProperties(ctx), trigger },
    posthog
  );
}

// User made a choice in the dialog
export function trackVoiceDialogChoice(
  ctx: VoiceAnalyticsContext,
  choice: "talk" | "listen" | "skip" | "leave",
  isConnected: boolean,
  posthog?: PostHog | null
) {
  trackEvent(
    "voiceDialogChoice",
    { ...getCommonProperties(ctx), choice, isConnected },
    posthog
  );
}

// User successfully connected to voice
export function trackVoiceConnected(
  ctx: VoiceAnalyticsContext,
  mode: "talk" | "listenOnly",
  posthog?: PostHog | null
) {
  trackEvent(
    "voiceConnected",
    { ...getCommonProperties(ctx), mode },
    posthog
  );
}

// User disconnected from voice
export function trackVoiceDisconnected(
  ctx: VoiceAnalyticsContext,
  posthog?: PostHog | null
) {
  trackEvent("voiceDisconnected", getCommonProperties(ctx), posthog);
}

// User toggled mic on/off
export function trackVoiceMicToggle(
  ctx: VoiceAnalyticsContext,
  micEnabled: boolean,
  posthog?: PostHog | null
) {
  trackEvent(
    "voiceMicToggle",
    { ...getCommonProperties(ctx), micEnabled },
    posthog
  );
}

// Permission error encountered
export function trackVoicePermissionError(
  ctx: VoiceAnalyticsContext,
  errorType: "denied" | "no_device" | "unknown",
  browser: string,
  posthog?: PostHog | null
) {
  trackEvent(
    "voicePermissionError",
    { ...getCommonProperties(ctx), errorType, browser },
    posthog
  );
}

// User chose to join as listener after permission error
export function trackVoiceListenOnlyFallback(
  ctx: VoiceAnalyticsContext,
  errorType: "denied" | "no_device",
  posthog?: PostHog | null
) {
  trackEvent(
    "voiceListenOnlyFallback",
    { ...getCommonProperties(ctx), errorType },
    posthog
  );
}

// Connection error (not permission-related)
export function trackVoiceConnectionError(
  ctx: VoiceAnalyticsContext,
  error: string,
  posthog?: PostHog | null
) {
  trackEvent(
    "voiceConnectionError",
    { ...getCommonProperties(ctx), error },
    posthog
  );
}
