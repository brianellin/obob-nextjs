import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
) => {
  const { getPostHogServer } = await import("@/lib/posthog-server");
  const posthog = getPostHogServer();

  // Try to extract distinct_id from the PostHog cookie
  const cookieHeader =
    (Array.isArray(request.headers.cookie)
      ? request.headers.cookie[0]
      : request.headers.cookie) || "";

  const phCookieMatch = cookieHeader.match(
    /ph_[^=]+=(%7B[^;]+|{[^;]+)/
  );

  let distinctId = "anonymous";
  if (phCookieMatch) {
    try {
      const decoded = decodeURIComponent(phCookieMatch[1]);
      const parsed = JSON.parse(decoded);
      if (parsed.distinct_id) {
        distinctId = parsed.distinct_id;
      }
    } catch {
      // Fall through to anonymous
    }
  }

  posthog.captureException(err, distinctId);
  await posthog.flush();
};
