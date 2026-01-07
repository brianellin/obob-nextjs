"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useRoomContext,
  TrackToggle,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Mic, MicOff, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import "@livekit/components-styles";

interface VoiceChatProps {
  roomName: string;
  participantName: string;
  participantIdentity: string;
  playerCount: number;
  onShowJoinDialog?: () => void;
}

interface VoiceControlsProps {
  startUnmuted?: boolean;
}

function VoiceControls({ startUnmuted = false }: VoiceControlsProps) {
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

  return (
    <TrackToggle
      source={Track.Source.Microphone}
      className={`
        flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium
        transition-colors flex-shrink-0
        ${isMuted 
          ? "bg-gray-100 text-gray-600 hover:bg-gray-200" 
          : "bg-green-100 text-green-700 hover:bg-green-200"
        }
      `}
    >
      {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{isMuted ? "Unmute" : "Mute"}</span>
    </TrackToggle>
  );
}

function VoiceRoomContent({ startUnmuted }: { startUnmuted: boolean }) {
  return (
    <>
      <VoiceControls startUnmuted={startUnmuted} />
      <RoomAudioRenderer />
    </>
  );
}

export function VoiceChat({ 
  roomName, 
  participantName, 
  participantIdentity,
  playerCount,
  onShowJoinDialog,
}: VoiceChatProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasTriggeredDialog, setHasTriggeredDialog] = useState(false);
  const [startUnmuted, setStartUnmuted] = useState(false);

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

  // Trigger dialog when player count goes from 1 to 2+
  useEffect(() => {
    if (playerCount > 1 && !hasTriggeredDialog && !isConnected && !isConnecting) {
      setHasTriggeredDialog(true);
      onShowJoinDialog?.();
    }
  }, [playerCount, hasTriggeredDialog, isConnected, isConnecting, onShowJoinDialog]);

  // Expose connect function globally so dialog can call it
  useEffect(() => {
    (window as Window & { __voiceChatConnect?: (unmuted: boolean) => void }).__voiceChatConnect = handleConnect;
    return () => {
      delete (window as Window & { __voiceChatConnect?: (unmuted: boolean) => void }).__voiceChatConnect;
    };
  }, [handleConnect]);

  if (error) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-50 text-red-600 text-xs flex-shrink-0">
        <VolumeX className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Voice error</span>
      </div>
    );
  }

  if (!token || !serverUrl) {
    if (isConnecting) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-100 text-gray-500 text-xs flex-shrink-0">
          <Volume2 className="h-3.5 w-3.5 animate-pulse" />
          <span className="hidden sm:inline">Connecting...</span>
        </div>
      );
    }
    return null;
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
      <VoiceRoomContent startUnmuted={startUnmuted} />
    </LiveKitRoom>
  );
}

interface VoiceJoinDialogProps {
  open: boolean;
  onClose: () => void;
  playerCount: number;
}

export function VoiceJoinDialog({ open, onClose, playerCount }: VoiceJoinDialogProps) {
  if (!open) return null;

  const handleJoinConversation = () => {
    (window as Window & { __voiceChatConnect?: (unmuted: boolean) => void }).__voiceChatConnect?.(true);
    onClose();
  };

  const handleStayMuted = () => {
    (window as Window & { __voiceChatConnect?: (unmuted: boolean) => void }).__voiceChatConnect?.(false);
    onClose();
  };

  const otherPlayers = playerCount - 1;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-blue-500" />
            Voice Chat Available
          </h3>
          <button
            onClick={handleStayMuted}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-muted-foreground">
          {otherPlayers === 1 
            ? "There's 1 other player in this room." 
            : `There are ${otherPlayers} other players in this room.`}
          {" "}Would you like to join the voice conversation?
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          Talk with your teammates while solving the crossword together!
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleStayMuted}
          >
            <MicOff className="h-4 w-4 mr-2" />
            Stay Muted
          </Button>
          <Button 
            className="flex-1"
            onClick={handleJoinConversation}
          >
            <Mic className="h-4 w-4 mr-2" />
            Join Conversation
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          You can change this anytime using the mic button
        </p>
      </div>
    </div>
  );
}
