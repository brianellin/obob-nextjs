"use client";

import { useState, useCallback } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
  useIsSpeaking,
  TrackToggle,
  DisconnectButton,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import "@livekit/components-styles";

interface VoiceChatProps {
  roomName: string;
  participantName: string;
  participantIdentity: string;
}

function VoiceParticipant({ 
  name, 
  isSelf,
  isSpeaking 
}: { 
  name: string; 
  isSelf: boolean;
  isSpeaking: boolean;
}) {
  return (
    <div 
      className={`
        flex items-center gap-2 px-2 py-1 rounded-full text-xs
        ${isSpeaking ? "bg-green-100 ring-2 ring-green-400" : "bg-gray-100"}
        ${isSelf ? "border border-blue-300" : ""}
        transition-all duration-150
      `}
    >
      <div className={`
        w-2 h-2 rounded-full 
        ${isSpeaking ? "bg-green-500 animate-pulse" : "bg-gray-400"}
      `} />
      <span className={isSelf ? "font-medium" : ""}>
        {name}{isSelf ? " (you)" : ""}
      </span>
    </div>
  );
}

function ParticipantWithSpeaking({ 
  participant, 
  localIdentity 
}: { 
  participant: { identity: string; name?: string }; 
  localIdentity: string;
}) {
  const isSpeaking = useIsSpeaking(participant as Parameters<typeof useIsSpeaking>[0]);
  const isSelf = participant.identity === localIdentity;
  
  return (
    <VoiceParticipant
      name={participant.name || participant.identity}
      isSelf={isSelf}
      isSpeaking={isSpeaking}
    />
  );
}

function VoiceRoomContent({ localIdentity }: { localIdentity: string }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const isMuted = !localParticipant.isMicrophoneEnabled;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {participants.map((participant) => (
          <ParticipantWithSpeaking
            key={participant.identity}
            participant={participant}
            localIdentity={localIdentity}
          />
        ))}
      </div>
      
      <div className="flex items-center gap-2">
        <TrackToggle
          source={Track.Source.Microphone}
          className={`
            flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium
            transition-colors
            ${isMuted 
              ? "bg-red-100 text-red-700 hover:bg-red-200" 
              : "bg-green-100 text-green-700 hover:bg-green-200"
            }
          `}
        >
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {isMuted ? "Unmute" : "Mute"}
        </TrackToggle>
        
        <DisconnectButton className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
          <PhoneOff className="h-4 w-4" />
          Leave
        </DisconnectButton>
      </div>
      
      <RoomAudioRenderer />
    </div>
  );
}

export function VoiceChat({ roomName, participantName, participantIdentity }: VoiceChatProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
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
  }, [roomName, participantName, participantIdentity]);

  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    setToken(null);
    setServerUrl(null);
    setIsConnecting(false);
  }, []);

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <span>{error}</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setError(null)}
          className="text-xs"
        >
          Dismiss
        </Button>
      </div>
    );
  }

  if (!token || !serverUrl) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Volume2 className="h-4 w-4" />
        {isConnecting ? "Connecting..." : "Join Voice Chat"}
      </Button>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      audio={true}
      video={false}
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
      <VoiceRoomContent localIdentity={participantIdentity} />
    </LiveKitRoom>
  );
}
