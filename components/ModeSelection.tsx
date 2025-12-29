import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Users, Trophy, Grid2X2, Dog, Sparkles } from "lucide-react";
import Link from "next/link";

type ModeSelectionProps = {
  year: string;
  division: string;
};

export default function ModeSelection({ year, division }: ModeSelectionProps) {
  return (
    <div className="space-y-10 max-w-2xl mx-auto">
      {/* Battles Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center font-[family-name:var(--font-playfair)] text-[hsl(var(--obob-bark))]">
          <span className="obob-section-title">Battles</span>
        </h2>
        <div className="space-y-4">
          <div className="flex gap-4 flex-col md:flex-row">
            <Card className="obob-card flex-1 rounded-xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="font-[family-name:var(--font-playfair)] text-[hsl(var(--obob-bark))]">
                  Solo battle
                </CardTitle>
                <CardDescription className="text-[hsl(var(--obob-bark))] opacity-60">
                  Practice at your own pace
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm text-[hsl(var(--obob-bark))] opacity-80 leading-relaxed">
                  Read and answer OBOB questions on your own, without time
                  pressure.
                </p>
              </CardContent>
              <CardFooter>
                <Link
                  href={`/battle/${year}/${division}?mode=personal`}
                  passHref
                  className="w-full"
                >
                  <Button className="w-full obob-btn-solo text-white border-0 font-semibold">
                    <User className="mr-2 h-4 w-4" /> Play solo
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            <Card className="obob-card flex-1 rounded-xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="font-[family-name:var(--font-playfair)] text-[hsl(var(--obob-bark))]">
                  Friend battle
                </CardTitle>
                <CardDescription className="text-[hsl(var(--obob-bark))] opacity-60">
                  Practice a real<i>ish</i> OBOB battle
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm text-[hsl(var(--obob-bark))] opacity-80 leading-relaxed">
                  Have a friend or parent read timed questions aloud to you or
                  your team.
                </p>
              </CardContent>
              <CardFooter>
                <Link
                  href={`/battle/${year}/${division}?mode=friend`}
                  passHref
                  className="w-full"
                >
                  <Button className="w-full obob-btn-friend text-white border-0 font-semibold">
                    <Users className="mr-2 h-4 w-4" /> Play with friends
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
          <Card className="obob-card rounded-xl overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <CardTitle className="font-[family-name:var(--font-playfair)] text-[hsl(var(--obob-bark))]">
                  Mock battle
                </CardTitle>
                <span className="obob-badge-new text-xs px-2.5 py-1 rounded-full">
                  New!
                </span>
              </div>
              <CardDescription className="text-[hsl(var(--obob-bark))] opacity-60">
                Coaches and parents this one is for you!
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-sm text-[hsl(var(--obob-bark))] opacity-80 leading-relaxed">
                Moderate a live in-person battle between two teams with timed
                questions, scoring, and steals.
              </p>
            </CardContent>
            <CardFooter>
              <Link
                href={`/mock-battle/${year}/${division}`}
                passHref
                className="w-full"
              >
                <Button className="w-full obob-btn-mock text-white border-0 font-semibold">
                  <Trophy className="mr-2 h-4 w-4" /> Moderate a mock battle
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Games Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center font-[family-name:var(--font-playfair)] text-[hsl(var(--obob-bark))]">
          <span className="obob-section-title">OBOB Games</span>
        </h2>
        <div className="space-y-4">
          <Card className="obob-card rounded-xl overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <CardTitle className="font-[family-name:var(--font-playfair)] italic text-[hsl(var(--obob-bark))]">
                  Zoomies
                </CardTitle>
                <span className="obob-badge-new text-xs px-2.5 py-1 rounded-full">
                  New!
                </span>
              </div>
              <CardDescription className="text-[hsl(var(--obob-bark))] opacity-60">
                Super fast-paced &quot;in which book&quot; questions
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-sm text-[hsl(var(--obob-bark))] opacity-80 leading-relaxed">
                15 seconds per question. Build streaks, earn combos, and compete
                for top dog!
              </p>
            </CardContent>
            <CardFooter>
              <Link
                href={`/zoomies/${year}/${division}`}
                passHref
                className="w-full"
              >
                <Button className="w-full obob-btn-zoomies text-white border-0 font-semibold">
                  <Dog className="mr-2 h-4 w-4" /> Play Zoomies
                </Button>
              </Link>
            </CardFooter>
          </Card>
          <Card className="obob-card rounded-xl overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <CardTitle className="font-[family-name:var(--font-playfair)] text-[hsl(var(--obob-bark))]">
                  Author Match
                </CardTitle>
              </div>
              <CardDescription className="text-[hsl(var(--obob-bark))] opacity-60">
                Match books to their authors
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-sm text-[hsl(var(--obob-bark))] opacity-80 leading-relaxed">
                Play a memory-style game matching book titles with their
                authors. Race against the clock!
              </p>
            </CardContent>
            <CardFooter>
              <Link
                href={`/author-match/${year}/${division}`}
                passHref
                className="w-full"
              >
                <Button className="w-full obob-btn-author text-white border-0 font-semibold">
                  <Grid2X2 className="mr-2 h-4 w-4" /> Play Author Match
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Coming Soon indicator */}
          <div className="flex items-center justify-center gap-3 text-[hsl(var(--obob-bark))] opacity-50 py-6">
            <Sparkles className="h-4 w-4 text-[hsl(var(--obob-amber))]" />
            <span className="text-sm font-medium">More games coming soon!</span>
            <Sparkles className="h-4 w-4 text-[hsl(var(--obob-amber))]" />
          </div>
        </div>
      </div>
    </div>
  );
}
