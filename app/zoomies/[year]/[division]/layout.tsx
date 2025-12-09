import type { Metadata } from "next";

type Props = {
  params: Promise<{ year: string; division: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year, division } = await params;

  return {
    title: `Zoomies - ${year} Division ${division} | OBOB.dog`,
    description: `Play OBOB Zoomies! Fast-paced "in which book" quiz game for ${year} division ${division}. Test your speed and knowledge with 15-second timed questions. Build streaks, earn combo multipliers, and compete for the top dog rank!`,
    openGraph: {
      title: `🐕 OBOB Zoomies - ${year} Division ${division}`,
      description: `Fast-paced OBOB quiz game! Answer "in which book" questions in 15 seconds. Build streaks for bonus points!`,
      type: "website",
    },
  };
}

export default function ZoomiesLayout({ children }: Props) {
  return <>{children}</>;
}
