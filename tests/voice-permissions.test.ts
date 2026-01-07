import { describe, it, expect, vi } from "vitest";
import {
  checkMicrophonePermission,
  requestMicrophoneAccess,
  detectBrowser,
  type NavigatorLike,
} from "@/lib/voice-permissions";

describe("Voice Permissions", () => {
  describe("checkMicrophonePermission", () => {
    it("should return 'unknown' when navigator is undefined", async () => {
      const result = await checkMicrophonePermission(undefined);
      expect(result).toBe("unknown");
    });

    it("should return 'unknown' when permissions API is not available", async () => {
      const nav: NavigatorLike = {};
      const result = await checkMicrophonePermission(nav);
      expect(result).toBe("unknown");
    });

    it("should return 'granted' when permission is granted", async () => {
      const nav: NavigatorLike = {
        permissions: {
          query: vi.fn().mockResolvedValue({ state: "granted" }),
        },
      };
      const result = await checkMicrophonePermission(nav);
      expect(result).toBe("granted");
    });

    it("should return 'denied' when permission is denied", async () => {
      const nav: NavigatorLike = {
        permissions: {
          query: vi.fn().mockResolvedValue({ state: "denied" }),
        },
      };
      const result = await checkMicrophonePermission(nav);
      expect(result).toBe("denied");
    });

    it("should return 'prompt' when permission requires prompt", async () => {
      const nav: NavigatorLike = {
        permissions: {
          query: vi.fn().mockResolvedValue({ state: "prompt" }),
        },
      };
      const result = await checkMicrophonePermission(nav);
      expect(result).toBe("prompt");
    });

    it("should return 'unknown' when permissions query throws", async () => {
      const nav: NavigatorLike = {
        permissions: {
          query: vi.fn().mockRejectedValue(new Error("Not supported")),
        },
      };
      const result = await checkMicrophonePermission(nav);
      expect(result).toBe("unknown");
    });

    it("should query for microphone permission", async () => {
      const queryMock = vi.fn().mockResolvedValue({ state: "granted" });
      const nav: NavigatorLike = {
        permissions: { query: queryMock },
      };
      await checkMicrophonePermission(nav);
      expect(queryMock).toHaveBeenCalledWith({ name: "microphone" });
    });
  });

  describe("requestMicrophoneAccess", () => {
    it("should return no_device error when navigator is undefined", async () => {
      const result = await requestMicrophoneAccess(undefined);
      expect(result).toEqual({ granted: false, error: "no_device" });
    });

    it("should return no_device error when mediaDevices is not available", async () => {
      const nav: NavigatorLike = {};
      const result = await requestMicrophoneAccess(nav);
      expect(result).toEqual({ granted: false, error: "no_device" });
    });

    it("should return granted when getUserMedia succeeds", async () => {
      const mockTrack = { stop: vi.fn() };
      const mockStream = {
        getTracks: vi.fn().mockReturnValue([mockTrack]),
      } as unknown as MediaStream;

      const nav: NavigatorLike = {
        mediaDevices: {
          getUserMedia: vi.fn().mockResolvedValue(mockStream),
        },
      };

      const result = await requestMicrophoneAccess(nav);
      expect(result).toEqual({ granted: true });
      expect(mockTrack.stop).toHaveBeenCalled();
    });

    it("should stop all tracks after successful access", async () => {
      const mockTrack1 = { stop: vi.fn() };
      const mockTrack2 = { stop: vi.fn() };
      const mockStream = {
        getTracks: vi.fn().mockReturnValue([mockTrack1, mockTrack2]),
      } as unknown as MediaStream;

      const nav: NavigatorLike = {
        mediaDevices: {
          getUserMedia: vi.fn().mockResolvedValue(mockStream),
        },
      };

      await requestMicrophoneAccess(nav);
      expect(mockTrack1.stop).toHaveBeenCalled();
      expect(mockTrack2.stop).toHaveBeenCalled();
    });

    it("should request audio only", async () => {
      const mockStream = {
        getTracks: vi.fn().mockReturnValue([]),
      } as unknown as MediaStream;
      const getUserMediaMock = vi.fn().mockResolvedValue(mockStream);

      const nav: NavigatorLike = {
        mediaDevices: { getUserMedia: getUserMediaMock },
      };

      await requestMicrophoneAccess(nav);
      expect(getUserMediaMock).toHaveBeenCalledWith({ audio: true });
    });

    it("should return denied error for NotAllowedError", async () => {
      const error = new Error("Permission denied");
      error.name = "NotAllowedError";

      const nav: NavigatorLike = {
        mediaDevices: {
          getUserMedia: vi.fn().mockRejectedValue(error),
        },
      };

      const result = await requestMicrophoneAccess(nav);
      expect(result).toEqual({ granted: false, error: "denied" });
    });

    it("should return denied error for PermissionDeniedError", async () => {
      const error = new Error("Permission denied");
      error.name = "PermissionDeniedError";

      const nav: NavigatorLike = {
        mediaDevices: {
          getUserMedia: vi.fn().mockRejectedValue(error),
        },
      };

      const result = await requestMicrophoneAccess(nav);
      expect(result).toEqual({ granted: false, error: "denied" });
    });

    it("should return no_device error for NotFoundError", async () => {
      const error = new Error("No device found");
      error.name = "NotFoundError";

      const nav: NavigatorLike = {
        mediaDevices: {
          getUserMedia: vi.fn().mockRejectedValue(error),
        },
      };

      const result = await requestMicrophoneAccess(nav);
      expect(result).toEqual({ granted: false, error: "no_device" });
    });

    it("should return no_device error for DevicesNotFoundError", async () => {
      const error = new Error("Devices not found");
      error.name = "DevicesNotFoundError";

      const nav: NavigatorLike = {
        mediaDevices: {
          getUserMedia: vi.fn().mockRejectedValue(error),
        },
      };

      const result = await requestMicrophoneAccess(nav);
      expect(result).toEqual({ granted: false, error: "no_device" });
    });

    it("should return error message for other errors", async () => {
      const error = new Error("Some other error");
      error.name = "SomeOtherError";

      const nav: NavigatorLike = {
        mediaDevices: {
          getUserMedia: vi.fn().mockRejectedValue(error),
        },
      };

      const result = await requestMicrophoneAccess(nav);
      expect(result).toEqual({ granted: false, error: "Some other error" });
    });

    it("should return unknown error for non-Error objects", async () => {
      const nav: NavigatorLike = {
        mediaDevices: {
          getUserMedia: vi.fn().mockRejectedValue("string error"),
        },
      };

      const result = await requestMicrophoneAccess(nav);
      expect(result).toEqual({ granted: false, error: "unknown" });
    });
  });

  describe("detectBrowser", () => {
    it("should return all false when navigator is undefined", () => {
      const result = detectBrowser(undefined);
      expect(result).toEqual({
        isChrome: false,
        isSafari: false,
        isFirefox: false,
      });
    });

    it("should return all false when userAgent is undefined", () => {
      const nav: NavigatorLike = {};
      const result = detectBrowser(nav);
      expect(result).toEqual({
        isChrome: false,
        isSafari: false,
        isFirefox: false,
      });
    });

    it("should detect Chrome browser", () => {
      const nav: NavigatorLike = {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      };
      const result = detectBrowser(nav);
      expect(result.isChrome).toBe(true);
      expect(result.isSafari).toBe(false);
      expect(result.isFirefox).toBe(false);
    });

    it("should detect Safari browser", () => {
      const nav: NavigatorLike = {
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
      };
      const result = detectBrowser(nav);
      expect(result.isChrome).toBe(false);
      expect(result.isSafari).toBe(true);
      expect(result.isFirefox).toBe(false);
    });

    it("should detect Firefox browser", () => {
      const nav: NavigatorLike = {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
      };
      const result = detectBrowser(nav);
      expect(result.isChrome).toBe(false);
      expect(result.isSafari).toBe(false);
      expect(result.isFirefox).toBe(true);
    });

    it("should not detect Chrome for Edge browser (Chromium-based)", () => {
      const nav: NavigatorLike = {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
      };
      const result = detectBrowser(nav);
      expect(result.isChrome).toBe(false);
      expect(result.isSafari).toBe(false);
      expect(result.isFirefox).toBe(false);
    });

    it("should return all false for unknown browser", () => {
      const nav: NavigatorLike = {
        userAgent: "Some Unknown Browser/1.0",
      };
      const result = detectBrowser(nav);
      expect(result).toEqual({
        isChrome: false,
        isSafari: false,
        isFirefox: false,
      });
    });

    it("should detect iOS Safari", () => {
      const nav: NavigatorLike = {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
      };
      const result = detectBrowser(nav);
      expect(result.isSafari).toBe(true);
      expect(result.isChrome).toBe(false);
    });

    it("should detect Chrome on iOS (actually Safari WebView)", () => {
      const nav: NavigatorLike = {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1",
      };
      const result = detectBrowser(nav);
      // Chrome on iOS uses Safari WebView, so this is technically Safari
      expect(result.isChrome).toBe(false);
      expect(result.isSafari).toBe(true);
    });
  });

  describe("Permission Flow Integration", () => {
    it("should handle complete flow: check permission then request access", async () => {
      const mockTrack = { stop: vi.fn() };
      const mockStream = {
        getTracks: vi.fn().mockReturnValue([mockTrack]),
      } as unknown as MediaStream;

      const nav: NavigatorLike = {
        permissions: {
          query: vi.fn().mockResolvedValue({ state: "prompt" }),
        },
        mediaDevices: {
          getUserMedia: vi.fn().mockResolvedValue(mockStream),
        },
      };

      const permState = await checkMicrophonePermission(nav);
      expect(permState).toBe("prompt");

      const accessResult = await requestMicrophoneAccess(nav);
      expect(accessResult.granted).toBe(true);
    });

    it("should handle denied permission without needing to request access", async () => {
      const nav: NavigatorLike = {
        permissions: {
          query: vi.fn().mockResolvedValue({ state: "denied" }),
        },
      };

      const permState = await checkMicrophonePermission(nav);
      expect(permState).toBe("denied");
    });

    it("should handle granted permission with immediate access", async () => {
      const mockTrack = { stop: vi.fn() };
      const mockStream = {
        getTracks: vi.fn().mockReturnValue([mockTrack]),
      } as unknown as MediaStream;

      const nav: NavigatorLike = {
        permissions: {
          query: vi.fn().mockResolvedValue({ state: "granted" }),
        },
        mediaDevices: {
          getUserMedia: vi.fn().mockResolvedValue(mockStream),
        },
      };

      const permState = await checkMicrophonePermission(nav);
      expect(permState).toBe("granted");

      const accessResult = await requestMicrophoneAccess(nav);
      expect(accessResult.granted).toBe(true);
    });

    it("should handle permission granted but device access fails", async () => {
      const error = new Error("No device");
      error.name = "NotFoundError";

      const nav: NavigatorLike = {
        permissions: {
          query: vi.fn().mockResolvedValue({ state: "granted" }),
        },
        mediaDevices: {
          getUserMedia: vi.fn().mockRejectedValue(error),
        },
      };

      const permState = await checkMicrophonePermission(nav);
      expect(permState).toBe("granted");

      const accessResult = await requestMicrophoneAccess(nav);
      expect(accessResult).toEqual({ granted: false, error: "no_device" });
    });

    it("should handle user denying permission prompt", async () => {
      const error = new Error("User denied");
      error.name = "NotAllowedError";

      const nav: NavigatorLike = {
        permissions: {
          query: vi.fn().mockResolvedValue({ state: "prompt" }),
        },
        mediaDevices: {
          getUserMedia: vi.fn().mockRejectedValue(error),
        },
      };

      const permState = await checkMicrophonePermission(nav);
      expect(permState).toBe("prompt");

      const accessResult = await requestMicrophoneAccess(nav);
      expect(accessResult).toEqual({ granted: false, error: "denied" });
    });
  });
});
