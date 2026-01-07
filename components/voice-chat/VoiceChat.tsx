"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { Mic, MicOff, Headphones, X } from "lucide-react";
import "@livekit/components-styles";

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

  // Expose unmute function for dialog
  useEffect(() => {
    (window as Window & { __voiceChatSetMic?: (enabled: boolean) => void }).__voiceChatSetMic = 
      (enabled: boolean) => room.localParticipant.setMicrophoneEnabled(enabled);
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
          transition-all flex-shrink-0 border
          ${isMuted 
            ? "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100" 
            : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 ring-2 ring-green-300 ring-opacity-50"
          }
        `}
        title={isMuted ? "You're listening only - tap to talk" : "You're talking - tap to change"}
      >
        {isMuted ? (
          <>
            <Headphones className="h-4 w-4" />
            <span className="hidden sm:inline">Listening</span>
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">Talking</span>
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasAutoShownDialog, setHasAutoShownDialog] = useState(false);
  const [startUnmuted, setStartUnmuted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleConnect = useCallback(async (unmuted: boolean = false) => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    setStartUnmuted(unmuted);
    setError(null);
    
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
      setError(err instanceof Error ? err.message : "Failed to connect");
      setIsConnecting(false);
    }
  }, [roomName, participantName, participantIdentity, isConnecting, isConnected]);

  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    setToken(null);
    setServerUrl(null);
    setIsConnecting(false);
  }, []);

  // Auto-show dialog when player count goes to 2+
  useEffect(() => {
    if (playerCount > 1 && !hasAutoShownDialog && !isConnected && !isConnecting) {
      setHasAutoShownDialog(true);
      setDialogOpen(true);
    }
  }, [playerCount, hasAutoShownDialog, isConnected, isConnecting]);

  const handleDialogChoice = (choice: "talk" | "listen" | "skip") => {
    setDialogOpen(false);
    if (choice === "skip") return;
    
    if (!isConnected) {
      handleConnect(choice === "talk");
    } else {
      // Already connected, just toggle mic
      (window as Window & { __voiceChatSetMic?: (enabled: boolean) => void }).__voiceChatSetMic?.(choice === "talk");
    }
  };

  // Not connected yet - show button to open dialog (only if 2+ players)
  if (!token || !serverUrl) {
    if (playerCount < 2) return null;
    
    if (isConnecting) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium border border-blue-200 flex-shrink-0">
          <Headphones className="h-4 w-4 animate-pulse" />
          <span className="hidden sm:inline">Joining...</span>
        </div>
      );
    }
    
    if (error) {
      return (
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium border border-red-200 flex-shrink-0 hover:bg-red-100"
        >
          <MicOff className="h-4 w-4" />
          <span className="hidden sm:inline">Retry</span>
        </button>
      );
    }

    return (
      <>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium border border-blue-200 flex-shrink-0 hover:bg-blue-100 transition-colors"
          title="Join voice chat with your teammates"
        >
          <Headphones className="h-4 w-4" />
          <span className="hidden sm:inline">Voice Chat</span>
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

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      audio={{ autoGainControl: true, noiseSuppression: true }}
      video={false}
      options={{
        publishDefaults: {
          audioPreset: { maxBitrate: 32000 },
        },
      }}
      onConnected={() => {
        setIsConnected(true);
        setIsConnecting(false);
      }}
      onDisconnected={handleDisconnected}
      onError={(err) => {
        console.error("LiveKit error:", err);
        setError(err.message);
      }}
    >
      <VoiceRoomControls 
        onRequestDialog={() => setDialogOpen(true)} 
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
  onChoice: (choice: "talk" | "listen" | "skip") => void;
  isConnected: boolean;
  playerCount: number;
}

function VoiceDialog({ open, onChoice, isConnected, playerCount }: VoiceDialogProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const otherPlayers = playerCount - 1;

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
            className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Headphones className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-800">Listen Only</div>
              <div className="text-sm text-gray-500">Hear others, stay quiet</div>
            </div>
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">
          Tap the mic button anytime to change
        </p>
      </div>
    </div>,
    document.body
  );
}
