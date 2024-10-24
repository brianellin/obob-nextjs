import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, User, Users } from "lucide-react";
import Link from "next/link";
import { WavyUnderline } from "./WavyUnderline";

type ModeSelectionProps = {
  onModeSelect: (mode: "personal" | "friend") => void;
};

export default function ModeSelection({ onModeSelect }: ModeSelectionProps) {
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
            <Button
              onClick={() => onModeSelect("personal")}
              className="w-full bg-purple-500 text-white hover:bg-purple-600 transition-colors"
            >
              <User className="mr-2 h-4 w-4" /> Play solo
            </Button>
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
            <Button
              onClick={() => onModeSelect("friend")}
              className="w-full bg-cyan-400 hover:bg-cyan-500 transition-colors"
            >
              <Users className="mr-2 h-4 w-4" /> Play with friends
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
