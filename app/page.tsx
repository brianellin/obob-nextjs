"use client";
import { BookOpen, Dog, Info, Zap, Megaphone } from "lucide-react";
import ModeSelection from "@/components/ModeSelection";
import { WavyUnderline } from "@/components/WavyUnderline";
import Link from "next/link";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";

export default function Home() {
  const [division, setDivision] = useState<string>("3-5");
  const year = "2024-2025"; // Could make this dynamic later

  return (
    <main className="bg-white p-2">
      <section className="max-w-2xl mx-auto space-y-4 mb-8 mt-4">
        <h1 className="text-4xl font-bold text-center">
          <WavyUnderline style={0} thickness={6} color="text-lime-400">
            obob.dog{" "}
          </WavyUnderline>
        </h1>
        <p className="text-xl text-center text-muted-foreground pt-1">
          Read, practice, and have fun with Oregon Battle of the Books
        </p>

        <div className="flex justify-center pt-2">
          <ToggleGroup
            type="single"
            value={division}
            onValueChange={(value) => {
              if (value) setDivision(value);
            }}
            className="justify-center"
          >
            <ToggleGroupItem
              value="3-5"
              aria-label="Elementary Division"
              className="data-[state=on]:bg-purple-600 data-[state=on]:text-white"
            >
              Elementary (3-5)
            </ToggleGroupItem>
            <ToggleGroupItem
              value="6-8"
              aria-label="Middle School Division"
              className="data-[state=on]:bg-purple-600 data-[state=on]:text-white"
            >
              Middle School (6-8)
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex justify-center space-x-8 pt-4">
          <Link
            href={`/books/${year}/${division}`}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <BookOpen className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">16</p>
              <p className="text-sm text-muted-foreground">Books</p>
            </div>
          </Link>
          <div className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">
                {division === "6-8" ? "3,820" : "4,365"}
              </p>
              <p className="text-sm text-muted-foreground">Questions</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Dog className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">1</p>
              <p className="text-sm text-muted-foreground">Dog</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-2xl mx-auto space-y-4 mb-8 mt-4">
        {division === "3-5" && (
          <Alert>
            <Megaphone className="h-6 w-6" />
            <AlertTitle className="ml-2">New Questions Alert</AlertTitle>
            <AlertDescription className="ml-2">
              We just added 514 new questions from Beaverton City Library for
              the 3-5 division. Enjoy!
            </AlertDescription>
          </Alert>
        )}
      </section>

      <ModeSelection year={year} division={division} />
    </main>
  );
}
