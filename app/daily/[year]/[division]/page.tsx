"use client";

import { Suspense, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import TeamSetup from "@/components/daily-crossword/TeamSetup";
import CollaborativeCrossword from "@/components/daily-crossword/CollaborativeCrossword";
import type { TeamState, SerializedCrosswordPuzzle } from "@/lib/daily-crossword/types";

interface PuzzleData {
  puzzle: SerializedCrosswordPuzzle;
  dateString: string;
  clueCount: number;
  timeUntilNext: {
    hours: number;
    minutes: number;
    seconds: number;
  };
}

function DailyContent() {
  const params = useParams();
  const router = useRouter();
  const year = params.year as string;
  const division = params.division as string;

  const [phase, setPhase] = useState<"loading" | "setup" | "playing">("loading");
  const [teamCode, setTeamCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [teamState, setTeamState] = useState<TeamState | null>(null);
  const [puzzleData, setPuzzleData] = useState<PuzzleData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate year/division
  useEffect(() => {
    if (
      !["2024-2025", "2025-2026"].includes(year) ||
      !["3-5", "6-8", "9-12"].includes(division)
    ) {
      router.push("/");
      return;
    }

    // Check if we have an existing session
    const storedTeamCode = sessionStorage.getItem(`daily-team-${year}-${division}`);
    const storedSessionId = localStorage.getItem("daily-crossword-session");

    if (storedTeamCode && storedSessionId) {
      // Try to rejoin the team
      rejoinTeam(storedTeamCode, storedSessionId);
    } else {
      setPhase("setup");
    }
  }, [year, division, router]);

  const rejoinTeam = async (code: string, session: string) => {
    try {
      const response = await fetch("/api/daily-crossword/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          year,
          division,
          teamCode: code,
          sessionId: session,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        handleTeamReady(data.teamCode, session, data.nickname);
      } else {
        // Team not found or expired, go to setup
        sessionStorage.removeItem(`daily-team-${year}-${division}`);
        setPhase("setup");
      }
    } catch {
      setPhase("setup");
    }
  };

  const handleTeamReady = async (code: string, session: string, name: string) => {
    setTeamCode(code);
    setSessionId(session);
    setNickname(name);

    // Store for rejoin
    sessionStorage.setItem(`daily-team-${year}-${division}`, code);

    // Load the puzzle
    try {
      const [puzzleRes, teamRes] = await Promise.all([
        fetch(`/api/daily-crossword/puzzle?year=${year}&division=${division}`),
        fetch(`/api/daily-crossword/team/${code}`),
      ]);

      if (!puzzleRes.ok || !teamRes.ok) {
        throw new Error("Failed to load puzzle data");
      }

      const puzzleJson = await puzzleRes.json();
      const teamJson = await teamRes.json();

      setPuzzleData(puzzleJson);
      setTeamState(teamJson.teamState);
      setPhase("playing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load puzzle");
      setPhase("setup");
    }
  };

  if (phase === "loading") {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setPhase("setup");
            }}
            className="underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (phase === "setup") {
    return (
      <main className="min-h-screen bg-white py-8">
        <TeamSetup
          year={year}
          division={division}
          onTeamReady={handleTeamReady}
        />
      </main>
    );
  }

  if (phase === "playing" && puzzleData && teamState && teamCode && sessionId && nickname) {
    return (
      <CollaborativeCrossword
        puzzle={puzzleData.puzzle}
        teamCode={teamCode}
        initialTeamState={teamState}
        sessionId={sessionId}
        nickname={nickname}
        dateString={puzzleData.dateString}
        year={year}
        division={division}
      />
    );
  }

  return null;
}

export default function DailyPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-gray-900" />
        </div>
      }
    >
      <DailyContent />
    </Suspense>
  );
}
