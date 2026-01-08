"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Copy, Check, ArrowRight, Loader2, Grid3X3, Link2 } from "lucide-react";
import { generateSessionId, getNicknameColor } from "@/lib/daily-crossword/team-codes";

interface TeamSetupProps {
  year: string;
  division: string;
  onTeamReady: (teamCode: string, sessionId: string, nickname: string, action: "created" | "joined") => void;
}

export default function TeamSetup({
  year,
  division,
  onTeamReady,
}: TeamSetupProps) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamCode, setTeamCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const getOrCreateSessionId = () => {
    const key = "daily-crossword-session";
    let sessionId = localStorage.getItem(key);
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem(key, sessionId);
    }
    return sessionId;
  };

  const handleCreateTeam = async () => {
    setLoading(true);
    setError(null);

    try {
      const sessionId = getOrCreateSessionId();
      const response = await fetch("/api/daily-crossword/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          year,
          division,
          sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create team");
      }

      setTeamCode(data.teamCode);
      setNickname(data.nickname);
      setMode("create");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) {
      setError("Please enter a team code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sessionId = getOrCreateSessionId();
      const response = await fetch("/api/daily-crossword/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          year,
          division,
          teamCode: joinCode.trim().toUpperCase(),
          sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join team");
      }

      onTeamReady(data.teamCode, sessionId, data.nickname, "joined");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(teamCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getShareableLink = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/crossword/${year}/${division}?team=${teamCode}`;
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(getShareableLink());
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleStartPuzzle = () => {
    const sessionId = getOrCreateSessionId();
    onTeamReady(teamCode, sessionId, nickname, "created");
  };

  const getDivisionLabel = (div: string) => {
    switch (div) {
      case "3-5":
        return "Elementary (3-5)";
      case "6-8":
        return "Middle School (6-8)";
      case "9-12":
        return "High School (9-12)";
      default:
        return div;
    }
  };

  if (mode === "choose") {
    return (
      <div className="max-w-lg mx-auto p-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Grid3X3 className="h-8 w-8 text-black" />
            <h1 className="text-3xl font-bold font-serif text-black">Daily Crossword</h1>
          </div>
          <p className="text-muted-foreground">
            {getDivisionLabel(division)} &bull; {year}
          </p>
        </div>

        <div className="bg-white border-2 border-black rounded-lg p-4 text-md text-black font-serif">
          <p className="font-bold mb-2">A new puzzle every day!</p>
          <p>
            Collaborate with teammates and friends to solve a crossword
            featuring content questions from all the books in your division.
          </p>
        </div>

        <div className="space-y-4">
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={handleCreateTeam}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Create a Team
              </CardTitle>
              <CardDescription>
                Start a new team and invite your friends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create Team
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Join a Team
              </CardTitle>
              <CardDescription>
                Enter a team code to join your friends
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Enter team code (e.g., BARK42)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="text-center text-lg font-mono uppercase"
                maxLength={12}
              />
              <Button
                className="w-full"
                onClick={handleJoinTeam}
                disabled={loading || !joinCode.trim()}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Join Team
              </Button>
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
            {error}
          </div>
        )}
      </div>
    );
  }

  if (mode === "create") {
    return (
      <div className="max-w-lg mx-auto p-4 space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold font-serif">Team Created!</h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-muted-foreground">You joined as</span>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium border"
              style={{
                backgroundColor: `${getNicknameColor(nickname)}12`,
                color: getNicknameColor(nickname),
                borderColor: `${getNicknameColor(nickname)}40`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getNicknameColor(nickname) }}
              />
              {nickname}
            </span>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                Share this link with your teammates
              </p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={getShareableLink()}
                  className="text-sm font-mono bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {linkCopied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Or share your team code
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-bold font-mono tracking-wider">
                  {teamCode}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCode}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-gray-100 border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-black">
                <strong>Tip:</strong> Share the link or code with your teammates so they
                can join! Everyone with the code or link can help solve the puzzle together.
              </p>
            </div>

            <Button className="w-full" size="lg" onClick={handleStartPuzzle}>
              Start Puzzle
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setMode("choose")}
        >
          Go Back
        </Button>
      </div>
    );
  }

  return null;
}
