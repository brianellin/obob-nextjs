import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Users, Trophy, Grid2X2, Sparkles, Dog, Grid3X3, Calendar } from "lucide-react";
import Link from "next/link";

type ModeSelectionProps = {
  year: string;
  division: string;
};

export default function ModeSelection({ year, division }: ModeSelectionProps) {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Battles Section */}
      <div>
        <h2 className="text-4xl font-bold mb-4 text-center font-rampart">Battles</h2>
        <div className="space-y-4">
          <div className="flex gap-4 flex-col md:flex-row">
            <Card>
              <CardHeader>
                <CardTitle>Solo battle</CardTitle>
                <CardDescription>Practice at your own pace</CardDescription>
              </CardHeader>
              <CardContent>
                <p>
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
                  <Button className="w-full bg-purple-500 text-white hover:bg-purple-600 transition-colors">
                    <User className="mr-2 h-4 w-4" /> Play solo
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Friend battle</CardTitle>
                <CardDescription>
                  Practice a real<i>ish</i> OBOB battle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
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
                  <Button className="w-full bg-cyan-400 hover:bg-cyan-500 transition-colors">
                    <Users className="mr-2 h-4 w-4" /> Play with friends
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Mock battle</CardTitle>
                <Badge className="bg-orange-500 hover:bg-orange-500 text-white">
                  New!
                </Badge>
              </div>
              <CardDescription>
                Coaches and parents this one is for you!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
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
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white transition-colors">
                  <Trophy className="mr-2 h-4 w-4" /> Moderate a mock battle
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Games Section */}
      <div>
        <h2 className="text-4xl font-bold mb-4 text-center font-rampart">OBOB Games</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="italic">Zoomies</CardTitle>
                <Badge className="bg-teal-500 hover:bg-teal-500 text-white">
                  New!
                </Badge>
              </div>
              <CardDescription>
                Super fast-paced &quot;in which book&quot; questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
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
                <Button className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white transition-colors">
                  <Dog className="mr-2 h-4 w-4" /> Play Zoomies
                </Button>
              </Link>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Author Match</CardTitle>
              </div>
              <CardDescription>Match books to their authors</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
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
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white transition-colors">
                  <Grid2X2 className="mr-2 h-4 w-4" /> Play Author Match
                </Button>
              </Link>
            </CardFooter>
          </Card>
          <Card className="border-2 border-indigo-600 bg-indigo-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="font-serif text-indigo-900">Daily Team Crossword</CardTitle>
                <Badge className="bg-indigo-600 hover:bg-indigo-600 text-white">
                  New!
                </Badge>
              </div>
              <CardDescription className="text-indigo-700">
                Solve today's puzzle with your team!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-indigo-800">
                A new crossword every day at 6am. Create a team, share your code,
                and solve it together. When stuck, send clues to teammates to look up in the books!
              </p>
            </CardContent>
            <CardFooter>
              <Link
                href={`/daily/${year}/${division}`}
                passHref
                className="w-full"
              >
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
                  <Calendar className="mr-2 h-4 w-4" /> Play Daily Crossword
                </Button>
              </Link>
            </CardFooter>
          </Card>
          <Card className="border-2 border-gray-900 bg-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="font-serif">Content Crossword</CardTitle>
              </div>
              <CardDescription>
                Solve crossword puzzles from book content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Test your knowledge with crossword puzzles generated from content
                questions. Choose your books and puzzle size for a relaxed
                puzzle-solving experience.
              </p>
            </CardContent>
            <CardFooter>
              <Link
                href={`/crossword/${year}/${division}`}
                passHref
                className="w-full"
              >
                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white transition-colors">
                  <Grid3X3 className="mr-2 h-4 w-4" /> Play Crossword
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Coming Soon indicator */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">More games coming soon!</span>
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
