"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Mic, MicOff, VolumeOff, X, AlertTriangle } from "lucide-react";
import "@livekit/components-styles";
import { usePostHog } from "posthog-js/react";
import {
  checkMicrophonePermission,
  requestMicrophoneAccess,
  detectBrowser,
} from "@/lib/voice-permissions";
import {
  trackVoiceDialogShown,
  trackVoiceDialogChoice,
  trackVoiceConnected,
  trackVoiceDisconnected,
  trackVoiceMicToggle,
  trackVoicePermissionError,
  trackVoiceListenOnlyFallback,
  trackVoiceConnectionError,
  type VoiceAnalyticsContext,
} from "@/lib/voice-analytics";

type VoiceState = "off" | "connecting" | "listening" | "talking";

interface VoiceChatProps {
  roomName: string;
  participantName: string;
  participantIdentity: string;
  playerCount: number;
}

function VoiceRoomControls({ 
  onRequestDialog,
  startUnmuted,
}: { 
  onRequestDialog: () => void;
  startUnmuted: boolean;
}) {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const hasSetInitialState = useRef(false);
  const isMuted = !localParticipant.isMicrophoneEnabled;

  useEffect(() => {
    if (!hasSetInitialState.current && localParticipant.isMicrophoneEnabled !== undefined) {
      hasSetInitialState.current = true;
      if (!startUnmuted && localParticipant.isMicrophoneEnabled) {
        room.localParticipant.setMicrophoneEnabled(false);
      } else if (startUnmuted && !localParticipant.isMicrophoneEnabled) {
        room.localParticipant.setMicrophoneEnabled(true);
      }
    }
  }, [localParticipant.isMicrophoneEnabled, room.localParticipant, startUnmuted]);

  // Expose mic control function for dialog
  useEffect(() => {
    (window as Window & { __voiceChatSetMic?: (enabled: boolean) => void }).__voiceChatSetMic = 
      async (enabled: boolean) => {
        if (enabled) {
          await room.localParticipant.setMicrophoneEnabled(true);
        } else {
          // Get the microphone track and stop it to fully release the mic
          const micPub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
          if (micPub?.track) {
            // Stop the track to release the microphone
            micPub.track.stop();
            await room.localParticipant.unpublishTrack(micPub.track);
          } else {
            // Fallback to just disabling
            await room.localParticipant.setMicrophoneEnabled(false);
          }
        }
      };
    return () => {
      delete (window as Window & { __voiceChatSetMic?: (enabled: boolean) => void }).__voiceChatSetMic;
    };
  }, [room.localParticipant]);

  return (
    <>
      <button
        onClick={onRequestDialog}
        className={`
          flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
          transition-all flex-shrink-0
          ${isMuted 
            ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100" 
            : "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
          }
        `}
        title={isMuted ? "Your mic is off - tap to change" : "Your mic is on - tap to change"}
      >
        {isMuted ? (
          <>
            <MicOff className="h-4 w-4" />
            <span className="hidden sm:inline">Mic Off</span>
          </>
        ) : (
          <>
            <div className="relative">
              <Mic className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <span className="hidden sm:inline">Mic On</span>
          </>
        )}
      </button>
      <RoomAudioRenderer />
    </>
  );
}

export function VoiceChat({ 
  roomName, 
  participantName, 
  participantIdentity,
  playerCount,
}: VoiceChatProps) {
  const posthog = usePostHog();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasAutoShownDialog, setHasAutoShownDialog] = useState(false);
  const [startUnmuted, setStartUnmuted] = useState(false);
  const [startListenOnly, setStartListenOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionError, setPermissionError] = useState<"denied" | "no_device" | null>(null);

  const analyticsContext: VoiceAnalyticsContext = useMemo(() => ({
    roomName,
    participantName,
    playerCount,
  }), [roomName, participantName, playerCount]);

  const handleConnect = useCallback(async (unmuted: boolean = false, listenOnly: boolean = false) => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    setStartUnmuted(unmuted);
    setStartListenOnly(listenOnly);
    setError(null);
    setPermissionError(null);
    
    // Only check/request microphone permission if user wants to talk
    if (!listenOnly) {
      const { isChrome, isSafari, isFirefox } = detectBrowser();
      const browserName = isChrome ? "chrome" : isSafari ? "safari" : isFirefox ? "firefox" : "other";
      
      const permStatus = await checkMicrophonePermission();
      if (permStatus === "denied") {
        setPermissionError("denied");
        trackVoicePermissionError(analyticsContext, "denied", browserName, posthog);
        setIsConnecting(false);
        return;
      }
      
      // If permission is unknown or prompt, try to request it
      if (permStatus !== "granted") {
        const result = await requestMicrophoneAccess();
        if (!result.granted) {
          if (result.error === "denied") {
            setPermissionError("denied");
            trackVoicePermissionError(analyticsContext, "denied", browserName, posthog);
          } else if (result.error === "no_device") {
            setPermissionError("no_device");
            trackVoicePermissionError(analyticsContext, "no_device", browserName, posthog);
          } else {
            setError(result.error || "Microphone access failed");
            trackVoicePermissionError(analyticsContext, "unknown", browserName, posthog);
          }
          setIsConnecting(false);
          return;
        }
      }
    }
    
    try {
      const response = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: `crossword-${roomName}`,
          participantName,
          participantIdentity,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get voice chat token");
      }
      
      const { token: jwt, url } = await response.json();
      setToken(jwt);
      setServerUrl(url);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to connect";
      setError(errorMsg);
      trackVoiceConnectionError(analyticsContext, errorMsg, posthog);
      setIsConnecting(false);
    }
  }, [roomName, participantName, participantIdentity, isConnecting, isConnected, analyticsContext, posthog]);

  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    setToken(null);
    setServerUrl(null);
    setIsConnecting(false);
    trackVoiceDisconnected(analyticsContext, posthog);
  }, [analyticsContext, posthog]);

  // Auto-show dialog when player count goes to 2+
  useEffect(() => {
    if (playerCount > 1 && !hasAutoShownDialog && !isConnected && !isConnecting) {
      setHasAutoShownDialog(true);
      setDialogOpen(true);
      trackVoiceDialogShown(analyticsContext, "auto", posthog);
    }
  }, [playerCount, hasAutoShownDialog, isConnected, isConnecting, analyticsContext, posthog]);

  const handleDialogChoice = (choice: "talk" | "listen" | "skip" | "leave") => {
    setDialogOpen(false);
    trackVoiceDialogChoice(analyticsContext, choice, isConnected, posthog);
    
    if (choice === "skip") return;
    
    if (choice === "leave") {
      // Disconnect from voice chat
      setToken(null);
      setServerUrl(null);
      setIsConnected(false);
      return;
    }
    
    if (!isConnected) {
      const wantsTalk = choice === "talk";
      const listenOnly = choice === "listen";
      handleConnect(wantsTalk, listenOnly);
    } else {
      // Already connected, just toggle mic
      const micEnabled = choice === "talk";
      (window as Window & { __voiceChatSetMic?: (enabled: boolean) => void }).__voiceChatSetMic?.(micEnabled);
      trackVoiceMicToggle(analyticsContext, micEnabled, posthog);
    }
  };

  // Not connected yet - show button to open dialog (only if 2+ players)
  if (!token || !serverUrl) {
    if (playerCount < 2) return null;
    
    if (isConnecting) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium border border-blue-200 flex-shrink-0">
          <MicOff className="h-4 w-4 animate-pulse" />
          <span className="hidden sm:inline">Joining...</span>
        </div>
      );
    }
    
    const openDialogManually = () => {
      setDialogOpen(true);
      trackVoiceDialogShown(analyticsContext, "manual", posthog);
    };

    if (error || permissionError) {
      return (
        <>
          <button
            onClick={openDialogManually}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium border border-red-200 flex-shrink-0 hover:bg-red-100"
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">{permissionError ? "Mic Blocked" : "Retry"}</span>
          </button>
          <VoiceDialog
            open={dialogOpen}
            onChoice={handleDialogChoice}
            isConnected={false}
            playerCount={playerCount}
            permissionError={permissionError}
            onRetryPermission={() => {
              setPermissionError(null);
              setError(null);
            }}
            onListenOnlyFallback={() => {
              if (permissionError) {
                trackVoiceListenOnlyFallback(analyticsContext, permissionError, posthog);
              }
            }}
          />
        </>
      );
    }

    return (
      <>
        <button
          onClick={openDialogManually}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200 flex-shrink-0 hover:bg-gray-200 transition-colors"
          title="Join voice chat with your teammates"
        >
          <MicOff className="h-4 w-4" />
          <span className="hidden sm:inline">Join Voice</span>
        </button>
        
        <VoiceDialog
          open={dialogOpen}
          onChoice={handleDialogChoice}
          isConnected={false}
          playerCount={playerCount}
        />
      </>
    );
  }

  const handleRequestDialogFromControls = () => {
    setDialogOpen(true);
    trackVoiceDialogShown(analyticsContext, "manual", posthog);
  };

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      audio={startListenOnly ? false : { autoGainControl: true, noiseSuppression: true }}
      video={false}
      options={{
        publishDefaults: {
          audioPreset: { maxBitrate: 32000 },
        },
      }}
      onConnected={() => {
        setIsConnected(true);
        setIsConnecting(false);
        trackVoiceConnected(analyticsContext, startListenOnly ? "listenOnly" : "talk", posthog);
      }}
      onDisconnected={handleDisconnected}
      onError={(err) => {
        console.error("LiveKit error:", err);
        setError(err.message);
        trackVoiceConnectionError(analyticsContext, err.message, posthog);
      }}
    >
      <VoiceRoomControls 
        onRequestDialog={handleRequestDialogFromControls} 
        startUnmuted={startUnmuted}
      />
      <VoiceDialog
        open={dialogOpen}
        onChoice={handleDialogChoice}
        isConnected={true}
        playerCount={playerCount}
      />
    </LiveKitRoom>
  );
}

interface VoiceDialogProps {
  open: boolean;
  onChoice: (choice: "talk" | "listen" | "skip" | "leave") => void;
  isConnected: boolean;
  playerCount: number;
  permissionError?: "denied" | "no_device" | null;
  onRetryPermission?: () => void;
  onListenOnlyFallback?: () => void;
}

function VoiceDialog({ open, onChoice, isConnected, playerCount, permissionError, onRetryPermission, onListenOnlyFallback }: VoiceDialogProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const otherPlayers = playerCount - 1;

  // Show permission error UI
  if (permissionError) {
    const isBlocked = permissionError === "denied";
    const { isChrome, isSafari, isFirefox } = detectBrowser();

    return createPortal(
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              {isBlocked ? "Microphone Blocked" : "No Microphone Found"}
            </h3>
            <button
              onClick={() => onChoice("skip")}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {isBlocked ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Your browser has blocked microphone access. To use voice chat, you'll need to allow microphone permissions.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <p className="font-medium text-gray-800 text-sm">How to fix this:</p>
                {isChrome && (
                  <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                    <li>Click the <span className="font-mono bg-gray-200 px-1 rounded">🔒</span> icon in the address bar</li>
                    <li>Find "Microphone" and change it to "Allow"</li>
                    <li>Refresh the page and try again</li>
                  </ol>
                )}
                {isSafari && (
                  <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                    <li>Go to Safari → Settings → Websites → Microphone</li>
                    <li>Find this website and change to "Allow"</li>
                    <li>Refresh the page and try again</li>
                  </ol>
                )}
                {isFirefox && (
                  <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                    <li>Click the <span className="font-mono bg-gray-200 px-1 rounded">🔒</span> icon in the address bar</li>
                    <li>Click "Connection secure" → "More Information"</li>
                    <li>Go to Permissions tab and allow Microphone</li>
                    <li>Refresh the page and try again</li>
                  </ol>
                )}
                {!isChrome && !isSafari && !isFirefox && (
                  <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                    <li>Look for a microphone or permissions icon in your address bar</li>
                    <li>Allow microphone access for this site</li>
                    <li>Refresh the page and try again</li>
                  </ol>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                We couldn't find a microphone on your device. Make sure your microphone is connected and not being used by another app.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="font-medium text-gray-800 text-sm">Things to check:</p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Connect a microphone or headset</li>
                  <li>Check that your microphone isn't muted</li>
                  <li>Close other apps that might be using the microphone</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                onRetryPermission?.();
                onChoice("skip");
              }}
              className="flex-1 py-3 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onRetryPermission?.();
              }}
              className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>

          <button
            onClick={() => {
              onListenOnlyFallback?.();
              onChoice("listen");
            }}
            className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Join as listener only (no mic needed)
          </button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Voice Chat 🎙️</h3>
          <button
            onClick={() => onChoice("skip")}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <p className="text-gray-600">
          {isConnected 
            ? "You're connected to voice chat. Choose how you want to participate:"
            : otherPlayers === 1 
              ? "There's 1 other player here! Want to talk while you solve the puzzle together?" 
              : `There are ${otherPlayers} other players here! Want to talk while you solve the puzzle together?`
          }
        </p>

        <div className="space-y-3">
          <button
            onClick={() => onChoice("talk")}
            className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Mic className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-green-800">Talk & Listen</div>
              <div className="text-sm text-green-600">Your teammates can hear you</div>
            </div>
          </button>

          <button
            onClick={() => onChoice("listen")}
            className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <MicOff className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <div className="font-semibold text-amber-800">Listen Only</div>
              <div className="text-sm text-amber-600">Hear others, mic off</div>
            </div>
          </button>

          {isConnected ? (
            <button
              onClick={() => onChoice("leave")}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-200 hover:bg-red-50 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <MicOff className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <div className="font-medium text-red-600">Leave Voice Chat</div>
                <div className="text-sm text-red-400">Disconnect completely</div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => onChoice("skip")}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <VolumeOff className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <div className="font-semibold text-gray-600">No thanks</div>
                <div className="text-sm text-gray-400">I'll just play quietly</div>
              </div>
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center">
          {isConnected 
            ? "Tap the mic button anytime to change" 
            : "Join and leave voice chat at any time."}
        </p>
      </div>
    </div>,
    document.body
  );
}
