import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Users, Trophy, Grid2X2, Dog, Zap } from "lucide-react";
import Link from "next/link";

type ModeSelectionProps = {
  year: string;
  division: string;
};

export default function ModeSelection({ year, division }: ModeSelectionProps) {
  return (
    <div className="space-y-12 max-w-2xl mx-auto">
      {/* Battles Section */}
      <div>
        <h2 className="text-xl font-black mb-8 text-center text-[hsl(var(--obob-bone))]">
          <span className="obob-section-title">Battles</span>
        </h2>
        <div className="space-y-4">
          <div className="flex gap-4 flex-col md:flex-row">
            <Card className="obob-card flex-1 rounded-none border-0">
              <CardHeader className="pb-2">
                <CardTitle className="font-black text-[hsl(var(--obob-bone))] uppercase tracking-wide text-base">
                  Solo Battle
                </CardTitle>
                <CardDescription className="text-[hsl(var(--obob-smoke))] text-xs uppercase tracking-wider">
                  Train alone
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm text-[hsl(var(--obob-smoke))] leading-relaxed">
                  Practice at your own pace. No timer. No pressure.
                </p>
              </CardContent>
              <CardFooter>
                <Link
                  href={`/battle/${year}/${division}?mode=personal`}
                  passHref
                  className="w-full"
                >
                  <Button className="w-full obob-btn-solo rounded-none h-11">
                    <User className="mr-2 h-4 w-4" /> Solo
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            <Card className="obob-card flex-1 rounded-none border-0">
              <CardHeader className="pb-2">
                <CardTitle className="font-black text-[hsl(var(--obob-bone))] uppercase tracking-wide text-base">
                  Friend Battle
                </CardTitle>
                <CardDescription className="text-[hsl(var(--obob-smoke))] text-xs uppercase tracking-wider">
                  Real battle mode
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm text-[hsl(var(--obob-smoke))] leading-relaxed">
                  Timed questions. A friend reads aloud. You answer.
                </p>
              </CardContent>
              <CardFooter>
                <Link
                  href={`/battle/${year}/${division}?mode=friend`}
                  passHref
                  className="w-full"
                >
                  <Button className="w-full obob-btn-friend rounded-none h-11">
                    <Users className="mr-2 h-4 w-4" /> Squad
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
          <Card className="obob-card rounded-none border-0">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <CardTitle className="font-black text-[hsl(var(--obob-bone))] uppercase tracking-wide text-base">
                  Mock Battle
                </CardTitle>
                <span className="obob-badge-new px-2 py-0.5 rounded-none">
                  New
                </span>
              </div>
              <CardDescription className="text-[hsl(var(--obob-smoke))] text-xs uppercase tracking-wider">
                For coaches & parents
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-sm text-[hsl(var(--obob-smoke))] leading-relaxed">
                Moderate live battles. Two teams. Timed rounds. Steals enabled.
              </p>
            </CardContent>
            <CardFooter>
              <Link
                href={`/mock-battle/${year}/${division}`}
                passHref
                className="w-full"
              >
                <Button className="w-full obob-btn-mock rounded-none h-11">
                  <Trophy className="mr-2 h-4 w-4" /> Moderate
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Games Section */}
      <div>
        <h2 className="text-xl font-black mb-8 text-center text-[hsl(var(--obob-bone))]">
          <span className="obob-section-title">Games</span>
        </h2>
        <div className="space-y-4">
          <Card className="obob-card rounded-none border-0">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <CardTitle className="font-black text-[hsl(var(--obob-bone))] uppercase tracking-wide text-base italic">
                  Zoomies
                </CardTitle>
                <span className="obob-badge-new px-2 py-0.5 rounded-none">
                  New
                </span>
              </div>
              <CardDescription className="text-[hsl(var(--obob-smoke))] text-xs uppercase tracking-wider">
                Speed round
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-sm text-[hsl(var(--obob-smoke))] leading-relaxed">
                15 seconds. Build streaks. Earn combos. Top dog wins.
              </p>
            </CardContent>
            <CardFooter>
              <Link
                href={`/zoomies/${year}/${division}`}
                passHref
                className="w-full"
              >
                <Button className="w-full obob-btn-zoomies rounded-none h-11">
                  <Dog className="mr-2 h-4 w-4" /> Zoomies
                </Button>
              </Link>
            </CardFooter>
          </Card>
          <Card className="obob-card rounded-none border-0">
            <CardHeader className="pb-2">
              <CardTitle className="font-black text-[hsl(var(--obob-bone))] uppercase tracking-wide text-base">
                Author Match
              </CardTitle>
              <CardDescription className="text-[hsl(var(--obob-smoke))] text-xs uppercase tracking-wider">
                Memory game
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-sm text-[hsl(var(--obob-smoke))] leading-relaxed">
                Match books to authors. Race the clock. Don&apos;t mess up.
              </p>
            </CardContent>
            <CardFooter>
              <Link
                href={`/author-match/${year}/${division}`}
                passHref
                className="w-full"
              >
                <Button className="w-full obob-btn-author rounded-none h-11">
                  <Grid2X2 className="mr-2 h-4 w-4" /> Match
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Coming Soon */}
          <div className="flex items-center justify-center gap-3 text-[hsl(var(--obob-smoke))] py-8">
            <Zap className="h-4 w-4 text-[hsl(var(--obob-volt))]" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">
              More games loading...
            </span>
            <Zap className="h-4 w-4 text-[hsl(var(--obob-volt))]" />
          </div>
        </div>
      </div>
    </div>
  );
}
