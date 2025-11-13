import { describe, it, expect } from 'vitest';
import type { QuestionWithBook } from '@/types';

// Type for a question result in mock battles
type QuestionResult = {
  question: QuestionWithBook;
  pointsAwarded: number;
  team?: "A" | "B";
  stolenBy?: "A" | "B";
};

// Helper function to calculate team score (extracted from QuizPage logic)
function calculateTeamScore(questionResults: QuestionResult[], team: "A" | "B"): number {
  return questionResults.reduce((total, result) => {
    if (result.pointsAwarded >= 0) {
      // If question was stolen by this team, they get the points
      if (result.stolenBy === team) {
        return total + result.pointsAwarded;
      }
      // If question was originally for this team and not stolen, they get the points
      if (result.team === team && !result.stolenBy) {
        return total + result.pointsAwarded;
      }
    }
    return total;
  }, 0);
}

// Helper function to determine if steal is eligible
function isStealsEligible(
  points: number,
  waitingForSteal: boolean,
  stealsEnabled: boolean
): boolean {
  return points === 0 && !waitingForSteal && stealsEnabled;
}

describe('Mock Battle Logic', () => {
  describe('Team Score Calculation', () => {
    it('should calculate score for team with only their own points', () => {
      const results: QuestionResult[] = [
        {
          question: {} as QuestionWithBook,
          pointsAwarded: 5,
          team: "A"
        },
        {
          question: {} as QuestionWithBook,
          pointsAwarded: 3,
          team: "A"
        },
        {
          question: {} as QuestionWithBook,
          pointsAwarded: 5,
          team: "B"
        }
      ];

      expect(calculateTeamScore(results, "A")).toBe(8);
      expect(calculateTeamScore(results, "B")).toBe(5);
    });

    it('should award points to stealing team when question is stolen', () => {
      const results: QuestionResult[] = [
        {
          question: {} as QuestionWithBook,
          pointsAwarded: 0,
          team: "A"
        },
        {
          question: {} as QuestionWithBook,
          pointsAwarded: 5,
          team: "A",
          stolenBy: "B" // Team B stole this question
        }
      ];

      expect(calculateTeamScore(results, "A")).toBe(0); // Team A got 0 pts, then lost the steal
      expect(calculateTeamScore(results, "B")).toBe(5); // Team B stole and got 5 pts
    });

    it('should not award points to original team when question is stolen', () => {
      const results: QuestionResult[] = [
        {
          question: {} as QuestionWithBook,
          pointsAwarded: 5,
          team: "A",
          stolenBy: "B"
        }
      ];

      expect(calculateTeamScore(results, "A")).toBe(0);
      expect(calculateTeamScore(results, "B")).toBe(5);
    });

    it('should handle mix of regular points and stolen points', () => {
      const results: QuestionResult[] = [
        {
          question: {} as QuestionWithBook,
          pointsAwarded: 5,
          team: "A"
        },
        {
          question: {} as QuestionWithBook,
          pointsAwarded: 0,
          team: "B"
        },
        {
          question: {} as QuestionWithBook,
          pointsAwarded: 3,
          team: "B",
          stolenBy: "A" // Team A stole
        },
        {
          question: {} as QuestionWithBook,
          pointsAwarded: 5,
          team: "A",
          stolenBy: "B" // Team B stole
        }
      ];

      // Team A: 5 (own) + 3 (stolen) = 8
      expect(calculateTeamScore(results, "A")).toBe(8);
      // Team B: 0 (own) + 5 (stolen) = 5
      expect(calculateTeamScore(results, "B")).toBe(5);
    });

    it('should ignore skipped questions (pointsAwarded: -1)', () => {
      const results: QuestionResult[] = [
        {
          question: {} as QuestionWithBook,
          pointsAwarded: 5,
          team: "A"
        },
        {
          question: {} as QuestionWithBook,
          pointsAwarded: -1, // Skipped
          team: "B"
        }
      ];

      expect(calculateTeamScore(results, "A")).toBe(5);
      expect(calculateTeamScore(results, "B")).toBe(0);
    });

    it('should handle empty results', () => {
      const results: QuestionResult[] = [];

      expect(calculateTeamScore(results, "A")).toBe(0);
      expect(calculateTeamScore(results, "B")).toBe(0);
    });

    it('should handle all incorrect answers', () => {
      const results: QuestionResult[] = [
        {
          question: {} as QuestionWithBook,
          pointsAwarded: 0,
          team: "A"
        },
        {
          question: {} as QuestionWithBook,
          pointsAwarded: 0,
          team: "B"
        }
      ];

      expect(calculateTeamScore(results, "A")).toBe(0);
      expect(calculateTeamScore(results, "B")).toBe(0);
    });
  });

  describe('Steal Eligibility', () => {
    it('should allow steal when points=0, not waiting, and steals enabled', () => {
      expect(isStealsEligible(0, false, true)).toBe(true);
    });

    it('should not allow steal when points > 0', () => {
      expect(isStealsEligible(3, false, true)).toBe(false);
      expect(isStealsEligible(5, false, true)).toBe(false);
    });

    it('should not allow steal when already waiting for steal', () => {
      expect(isStealsEligible(0, true, true)).toBe(false);
    });

    it('should not allow steal when steals disabled', () => {
      expect(isStealsEligible(0, false, false)).toBe(false);
    });

    it('should handle all conditions false', () => {
      expect(isStealsEligible(5, true, false)).toBe(false);
    });
  });

  describe('Team Alternation', () => {
    it('should alternate from Team A to Team B', () => {
      const currentTeam = "A";
      const nextTeam = currentTeam === "A" ? "B" : "A";
      expect(nextTeam).toBe("B");
    });

    it('should alternate from Team B to Team A', () => {
      const currentTeam = "B";
      const nextTeam = currentTeam === "A" ? "B" : "A";
      expect(nextTeam).toBe("A");
    });
  });

  describe('Mock Battle Scoring Scenarios', () => {
    it('should calculate correct score for typical mock battle', () => {
      // Simulated mock battle with 8 questions
      const results: QuestionResult[] = [
        // Round 1: Team A gets 5 pts
        { question: {} as QuestionWithBook, pointsAwarded: 5, team: "A" },
        // Round 2: Team B gets 0 pts, Team A steals for 3 pts
        { question: {} as QuestionWithBook, pointsAwarded: 0, team: "B" },
        { question: {} as QuestionWithBook, pointsAwarded: 3, team: "B", stolenBy: "A" },
        // Round 3: Team A gets 3 pts
        { question: {} as QuestionWithBook, pointsAwarded: 3, team: "A" },
        // Round 4: Team B gets 5 pts
        { question: {} as QuestionWithBook, pointsAwarded: 5, team: "B" },
        // Round 5: Team A gets 0 pts, Team B steals for 5 pts
        { question: {} as QuestionWithBook, pointsAwarded: 0, team: "A" },
        { question: {} as QuestionWithBook, pointsAwarded: 5, team: "A", stolenBy: "B" },
        // Round 6: Team B gets 5 pts
        { question: {} as QuestionWithBook, pointsAwarded: 5, team: "B" }
      ];

      // Team A: 5 + 3 (stolen) + 3 = 11
      expect(calculateTeamScore(results, "A")).toBe(11);
      // Team B: 5 + 5 (stolen) + 5 = 15
      expect(calculateTeamScore(results, "B")).toBe(15);
    });

    it('should handle battle with steals disabled (no steal opportunities)', () => {
      const results: QuestionResult[] = [
        { question: {} as QuestionWithBook, pointsAwarded: 5, team: "A" },
        { question: {} as QuestionWithBook, pointsAwarded: 0, team: "B" }, // No steal
        { question: {} as QuestionWithBook, pointsAwarded: 3, team: "A" },
        { question: {} as QuestionWithBook, pointsAwarded: 5, team: "B" }
      ];

      expect(calculateTeamScore(results, "A")).toBe(8);
      expect(calculateTeamScore(results, "B")).toBe(5);
    });
  });
});
