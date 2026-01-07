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
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import "@livekit/components-styles";

interface VoiceChatProps {
  roomName: string;
  participantName: string;
  participantIdentity: string;
  playerCount: number;
}

function VoiceControls() {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const hasMutedOnMount = useRef(false);
  const isMuted = !localParticipant.isMicrophoneEnabled;

  useEffect(() => {
    if (!hasMutedOnMount.current && localParticipant.isMicrophoneEnabled) {
      hasMutedOnMount.current = true;
      room.localParticipant.setMicrophoneEnabled(false);
    }
  }, [localParticipant.isMicrophoneEnabled, room.localParticipant]);

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

function VoiceRoomContent() {
  return (
    <>
      <VoiceControls />
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
  const [hasAutoConnected, setHasAutoConnected] = useState(false);

  const handleConnect = useCallback(async () => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
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

  useEffect(() => {
    if (playerCount > 1 && !hasAutoConnected && !isConnected && !isConnecting) {
      setHasAutoConnected(true);
      handleConnect();
    }
  }, [playerCount, hasAutoConnected, isConnected, isConnecting, handleConnect]);

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
        
        // Start muted by default
      }}
      onDisconnected={handleDisconnected}
      onError={(err) => {
        console.error("LiveKit error:", err);
        setError(err.message);
      }}
    >
      <VoiceRoomContent />
    </LiveKitRoom>
  );
}
