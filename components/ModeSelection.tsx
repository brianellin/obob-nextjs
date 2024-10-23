"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { User, Users } from "lucide-react";

type ModeSelectionProps = {
  onSelectMode: (mode: "personal" | "friend") => void;
};

export default function ModeSelection({ onSelectMode }: ModeSelectionProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">
          Select Quiz Mode
        </CardTitle>
        <CardDescription className="text-center text-lg mt-2">
          Choose how you want to practice for the Oregon Battle of the Books
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col space-y-6">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <Button
              onClick={() => onSelectMode("personal")}
              className="w-full flex items-center justify-center text-lg py-8 px-6"
            >
              <div className="flex items-center">
                <User className="mr-4 h-8 w-8" />
                <span className="text-xl font-semibold">Personal Mode</span>
              </div>
            </Button>
            <p className="mt-4 text-gray-600">
              Practice on your own with a 15-second timer for each question.
              Great for individual study and improving your speed!
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <Button
              onClick={() => onSelectMode("friend")}
              className="w-full flex items-center justify-center text-lg py-8 px-6"
            >
              <div className="flex items-center">
                <Users className="mr-4 h-8 w-8" />
                <span className="text-xl font-semibold">Friend Mode</span>
              </div>
            </Button>
            <p className="mt-4 text-gray-600">
              Quiz a friend or have them quiz you. No timer, just mark answers
              as correct or incorrect. Perfect for group study sessions!
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
