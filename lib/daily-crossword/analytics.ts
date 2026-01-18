import { track as vercelTrack } from "@vercel/analytics";
import type { PostHog } from "posthog-js";

const isProduction = process.env.NODE_ENV === "production";

export interface CrosswordAnalyticsContext {
  teamCode: string;
  date: string;
  division: string;
  year: string;
  userName: string;
  generatedName: string;
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
    console.log(`[Crossword Analytics Dev] ${eventName}`, cleanProperties);
    return;
  }

  vercelTrack(eventName, cleanProperties);
  posthog?.capture(eventName, cleanProperties);
}

function getCommonProperties(ctx: CrosswordAnalyticsContext) {
  return {
    teamCode: ctx.teamCode,
    date: ctx.date,
    division: ctx.division,
    year: ctx.year,
    userName: ctx.userName,
    generatedName: ctx.generatedName,
  };
}

export function trackTeamCreated(
  ctx: CrosswordAnalyticsContext,
  posthog?: PostHog | null
) {
  trackEvent("crosswordTeamCreated", getCommonProperties(ctx), posthog);
}

export function trackTeamJoined(
  ctx: CrosswordAnalyticsContext,
  posthog?: PostHog | null
) {
  trackEvent("crosswordTeamJoined", getCommonProperties(ctx), posthog);
}

export function trackTeammateInvited(
  ctx: CrosswordAnalyticsContext,
  method: "code" | "link",
  posthog?: PostHog | null
) {
  trackEvent(
    "crosswordTeammateInvited",
    { ...getCommonProperties(ctx), method },
    posthog
  );
}

export function trackClueSelected(
  ctx: CrosswordAnalyticsContext,
  clueNumber: number,
  clueDirection: "across" | "down",
  clueId: string,
  posthog?: PostHog | null
) {
  // Disabled to reduce PostHog event volume - this fires on every clue click
  // and provides minimal value compared to clue completion events
  if (!isProduction) {
    console.log(`[Crossword Analytics Dev] crosswordClueSelected (disabled)`, {
      ...getCommonProperties(ctx),
      clueNumber,
      clueDirection,
      clueId,
    });
  }
}

export function trackClueCompleted(
  ctx: CrosswordAnalyticsContext,
  clueNumber: number,
  clueDirection: "across" | "down",
  clueId: string,
  posthog?: PostHog | null
) {
  trackEvent(
    "crosswordClueCompleted",
    {
      ...getCommonProperties(ctx),
      clueNumber,
      clueDirection,
      clueId,
    },
    posthog
  );
}

export function trackPuzzleCompleted(
  ctx: CrosswordAnalyticsContext,
  completionTimeMs: number,
  memberCount: number,
  posthog?: PostHog | null
) {
  trackEvent(
    "crosswordPuzzleCompleted",
    {
      ...getCommonProperties(ctx),
      completionTimeMs,
      memberCount,
    },
    posthog
  );
}
