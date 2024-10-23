import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserIcon, UsersIcon } from "lucide-react";

type ModeSelectionProps = {
  onSelectMode: (mode: "personal" | "friend") => void;
};

export default function ModeSelection({ onSelectMode }: ModeSelectionProps) {
  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
      <Card className="w-full sm:w-64">
        <CardHeader>
          <CardTitle className="flex items-center justify-center">
            <UserIcon className="mr-2" />
            Personal Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Quiz yourself by reading and answering questions on your own.
          </CardDescription>
        </CardContent>
        <CardFooter>
          <Button onClick={() => onSelectMode("personal")} className="w-full">
            Select
          </Button>
        </CardFooter>
      </Card>
      <Card className="w-full sm:w-64">
        <CardHeader>
          <CardTitle className="flex items-center justify-center">
            <UsersIcon className="mr-2" />
            Friend Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Read questions aloud to friends and manage their responses.
          </CardDescription>
        </CardContent>
        <CardFooter>
          <Button onClick={() => onSelectMode("friend")} className="w-full">
            Select
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
