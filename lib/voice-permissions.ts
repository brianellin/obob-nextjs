export type PermissionState = "unknown" | "granted" | "denied" | "prompt";

export type PermissionResult = {
  granted: boolean;
  error?: "denied" | "no_device" | string;
};

export type NavigatorLike = {
  permissions?: {
    query: (desc: { name: string }) => Promise<{ state: string }>;
  };
  mediaDevices?: {
    getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  };
  userAgent?: string;
};

function getNavigator(): NavigatorLike | undefined {
  if (typeof navigator === "undefined") return undefined;
  return navigator as NavigatorLike;
}

export async function checkMicrophonePermission(
  nav: NavigatorLike | undefined = getNavigator()
): Promise<PermissionState> {
  try {
    if (!nav || !nav.permissions) {
      return "unknown";
    }
    const result = await nav.permissions.query({
      name: "microphone",
    });
    return result.state as PermissionState;
  } catch {
    return "unknown";
  }
}

export async function requestMicrophoneAccess(
  nav: NavigatorLike | undefined = getNavigator()
): Promise<PermissionResult> {
  try {
    if (!nav || !nav.mediaDevices) {
      return { granted: false, error: "no_device" };
    }
    const stream = await nav.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return { granted: true };
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        return { granted: false, error: "denied" };
      }
      if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        return { granted: false, error: "no_device" };
      }
      return { granted: false, error: err.message };
    }
    return { granted: false, error: "unknown" };
  }
}

export function detectBrowser(
  nav: NavigatorLike | undefined = getNavigator()
): {
  isChrome: boolean;
  isSafari: boolean;
  isFirefox: boolean;
} {
  if (!nav || !nav.userAgent) {
    return { isChrome: false, isSafari: false, isFirefox: false };
  }
  const ua = nav.userAgent;
  return {
    isChrome: /Chrome/.test(ua) && !/Edg/.test(ua),
    isSafari: /Safari/.test(ua) && !/Chrome/.test(ua),
    isFirefox: /Firefox/.test(ua),
  };
}
