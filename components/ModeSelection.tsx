import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Users } from "lucide-react";
import Link from "next/link";

export default function ModeSelection() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
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
            <Link href="/battle?mode=personal" passHref className="w-full">
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
              Have a friend or parent read timed questions aloud to your or your
              team.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/battle?mode=friend" passHref className="w-full">
              <Button className="w-full bg-cyan-400 hover:bg-cyan-500 transition-colors">
                <Users className="mr-2 h-4 w-4" /> Play with friends
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
