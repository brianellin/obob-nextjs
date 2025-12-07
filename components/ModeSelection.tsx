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
import { User, Users, Trophy, Grid2X2, Zap } from "lucide-react";
import Link from "next/link";

type ModeSelectionProps = {
  year: string;
  division: string;
};

export default function ModeSelection({ year, division }: ModeSelectionProps) {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* ZOOMIES - Hidden while testing with friends. Direct link still works: /zoomies/{year}/{division}
      <Card className="border-2 border-fuchsia-400 bg-gradient-to-br from-violet-50 to-fuchsia-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">Zoomies</CardTitle>
            <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white">
              New!
            </Badge>
          </div>
          <CardDescription>Fast-paced book identification game</CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Identify the right book in 15 seconds, in this new{" "}
            <span className="italic">in which book</span> game. Perfect for
            quick practice on the go.
          </p>
        </CardContent>
        <CardFooter>
          <Link
            href={`/zoomies/${year}/${division}`}
            passHref
            className="w-full"
          >
            <Button className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]">
              <Zap className="mr-2 h-4 w-4" /> Start Zoomies
            </Button>
          </Link>
        </CardFooter>
      </Card>
      */}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Author Match</CardTitle>
          </div>
          <CardDescription>Match books to their authors</CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Play a memory-style game matching book titles with their authors.
            Race against the clock!
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
      <div className="flex gap-4 flex-col md:flex-row">
        <Card>
          <CardHeader>
            <CardTitle>Solo battle</CardTitle>
            <CardDescription>Practice at your own pace</CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Read and answer OBOB questions on your own, without time pressure.
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
              Have a friend or parent read timed questions aloud to you or your
              team.
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
  );
}
