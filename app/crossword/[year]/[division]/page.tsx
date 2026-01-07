import type { Metadata } from "next";
import CrosswordClient from "./CrosswordClient";

type Props = {
  params: Promise<{ year: string; division: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function getDivisionLabel(division: string): string {
  switch (division) {
    case "3-5":
      return "Elementary (3-5)";
    case "6-8":
      return "Middle School (6-8)";
    case "9-12":
      return "High School (9-12)";
    default:
      return division;
  }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { year, division } = await params;
  const resolvedSearchParams = await searchParams;
  
  const teamCode = typeof resolvedSearchParams.team === "string" 
    ? resolvedSearchParams.team.toUpperCase() 
    : undefined;
  const clue = typeof resolvedSearchParams.clue === "string" 
    ? resolvedSearchParams.clue 
    : undefined;

  const divisionLabel = getDivisionLabel(division);
  
  // Build title and description based on context
  let title: string;
  let description: string;
  
  if (teamCode && clue) {
    // Help request link - teammate needs help with specific clue
    const [clueNumber, clueDirection] = clue.split("-");
    title = `Help Team ${teamCode} - ${clueNumber} ${clueDirection?.toUpperCase() || ""} | OBOB Daily Crossword`;
    description = `Your teammate needs help with a clue! Join team ${teamCode} and help solve the ${divisionLabel} crossword puzzle together.`;
  } else if (teamCode) {
    // Team invite link
    title = `Join Team ${teamCode} | OBOB Daily Crossword`;
    description = `You've been invited to join team ${teamCode}! Help solve the ${divisionLabel} crossword puzzle together in real-time.`;
  } else {
    // Default crossword page
    title = `Daily Team Crossword - ${divisionLabel} | OBOB.dog`;
    description = `Solve today's OBOB crossword puzzle with your team! ${divisionLabel} division for ${year}. Collaborate in real-time to answer book trivia questions.`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "OBOB.dog",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function DailyPage() {
  return <CrosswordClient />;
}
