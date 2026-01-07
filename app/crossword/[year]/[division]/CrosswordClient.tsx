"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { Loader2 } from "lucide-react";
import TeamSetup from "@/components/daily-crossword/TeamSetup";
import RealtimeCrossword from "@/components/daily-crossword/RealtimeCrossword";
import type { TeamState, SerializedCrosswordPuzzle } from "@/lib/daily-crossword/types";
import {
  trackTeamCreated,
  trackTeamJoined,
  type CrosswordAnalyticsContext,
} from "@/lib/daily-crossword/analytics";

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
  const searchParams = useSearchParams();
  const posthog = usePostHog();
  const year = params.year as string;
  const division = params.division as string;

  // Check for team code and clue from URL query params (for help links)
  const urlTeamCode = searchParams.get("team");
  const urlClue = searchParams.get("clue"); // Format: "1-across" or "2-down"

  const [phase, setPhase] = useState<"loading" | "setup" | "playing">("loading");
  const [teamCode, setTeamCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [teamState, setTeamState] = useState<TeamState | null>(null);
  const [puzzleData, setPuzzleData] = useState<PuzzleData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialClue, setInitialClue] = useState<string | null>(null);
  const [isInvitedUser, setIsInvitedUser] = useState(false);
  const pendingAnalyticsRef = useRef<"created" | "joined" | null>(null);

  // Validate year/division
  useEffect(() => {
    if (
      !["2024-2025", "2025-2026"].includes(year) ||
      !["3-5", "6-8", "9-12"].includes(division)
    ) {
      router.push("/");
      return;
    }

    // Set the initial clue for auto-selection if provided in URL
    if (urlClue) {
      setInitialClue(urlClue);
    }

    const storedSessionId = localStorage.getItem("daily-crossword-session");
    const storedTeamCode = sessionStorage.getItem(`daily-team-${year}-${division}`);

    // URL team code takes precedence over stored team code - auto-join the team
    if (urlTeamCode) {
      setIsInvitedUser(true);
      
      // Clear stored team if URL specifies a different one
      if (storedTeamCode && storedTeamCode !== urlTeamCode.toUpperCase()) {
        sessionStorage.removeItem(`daily-team-${year}-${division}`);
      }
      
      // Auto-join the team (create session if needed)
      autoJoinTeam(urlTeamCode);
      return;
    }

    // Fall back to stored session if no URL team code
    if (storedTeamCode && storedSessionId) {
      rejoinTeam(storedTeamCode, storedSessionId);
    } else {
      setPhase("setup");
    }
  }, [year, division, router, urlTeamCode, urlClue]);

  const autoJoinTeam = async (code: string) => {
    try {
      // Get or create session ID
      let sessionId = localStorage.getItem("daily-crossword-session");
      if (!sessionId) {
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem("daily-crossword-session", sessionId);
      }

      const response = await fetch("/api/daily-crossword/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          year,
          division,
          teamCode: code.toUpperCase(),
          sessionId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        pendingAnalyticsRef.current = "joined";
        handleTeamReady(data.teamCode, sessionId, data.nickname);
      } else {
        // Team not found or expired, go to setup
        setIsInvitedUser(false);
        setPhase("setup");
      }
    } catch {
      setIsInvitedUser(false);
      setPhase("setup");
    }
  };

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

  const handleTeamReady = async (
    code: string,
    session: string,
    name: string,
    action?: "created" | "joined"
  ) => {
    setTeamCode(code);
    setSessionId(session);
    setNickname(name);

    // Store for rejoin
    sessionStorage.setItem(`daily-team-${year}-${division}`, code);

    // Track pending analytics action from URL-based joins
    const analyticsAction = action || pendingAnalyticsRef.current;
    pendingAnalyticsRef.current = null;

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

      // Track analytics now that we have the date
      if (analyticsAction) {
        const ctx: CrosswordAnalyticsContext = {
          teamCode: code,
          date: puzzleJson.dateString,
          division,
          year,
          userName: name, // The generated nickname
          generatedName: name,
        };

        if (analyticsAction === "created") {
          trackTeamCreated(ctx, posthog);
        } else if (analyticsAction === "joined") {
          trackTeamJoined(ctx, posthog);
        }
      }
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

  const handleLeaveRoom = () => {
    sessionStorage.removeItem(`daily-team-${year}-${division}`);
    setTeamCode(null);
    setTeamState(null);
    setPhase("setup");
  };

  if (phase === "playing" && puzzleData && teamState && teamCode && sessionId && nickname) {
    return (
      <RealtimeCrossword
        puzzle={puzzleData.puzzle}
        teamCode={teamCode}
        initialTeamState={teamState}
        sessionId={sessionId}
        nickname={nickname}
        dateString={puzzleData.dateString}
        year={year}
        division={division}
        wsUrl={process.env.NEXT_PUBLIC_CROSSWORD_WS_URL || "ws://localhost:8787"}
        initialClue={initialClue}
        isInvitedUser={isInvitedUser}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  return null;
}

export default function CrosswordClient() {
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
