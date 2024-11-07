"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, PawPrint } from "lucide-react";
import Image from "next/image";
import { Book, Books } from "../types";
import { WavyUnderline } from "./WavyUnderline";
import booksJson from "@/public/obob/books.json";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type QuestionType = "in-which-book" | "content" | "both";

type BookSelectionProps = {
  onSelectBooks: (
    selectedBooks: Book[],
    questionCount: number,
    questionType: QuestionType
  ) => void;
};

export default function BookSelection({ onSelectBooks }: BookSelectionProps) {
  const books: Books = booksJson.books as Books;
  const [selectedBookKeys, setSelectedBookKeys] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [questionCount, setQuestionCount] = useState<string>("16");
  const [questionType, setQuestionType] = useState<QuestionType>("both");
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    const checkIfMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const handleToggleBook = (bookKey: string) => {
    setSelectedBookKeys((prev) =>
      prev.includes(bookKey)
        ? prev.filter((key) => key !== bookKey)
        : [...prev, bookKey]
    );
  };

  const handleSelectAll = () => {
    setSelectedBookKeys(Object.keys(books));
  };

  const handleDeselectAll = () => {
    setSelectedBookKeys([]);
  };

  const handleToggleAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      handleSelectAll();
    } else {
      handleDeselectAll();
    }
  };

  const handleSubmit = () => {
    const selectedBooks = selectedBookKeys.map((key) => ({
      ...books[key],
      book_key: key,
    }));
    onSelectBooks(
      selectedBooks.length === 0
        ? Object.entries(books).map(([key, book]) => ({
            ...book,
            book_key: key,
          }))
        : selectedBooks,
      parseInt(questionCount),
      questionType
    );
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0 relative">
      <Card className="w-full max-w-6xl mx-auto mb-4 border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            <WavyUnderline style={0} thickness={4} color="text-lime-400">
              Pick your battle{" "}
            </WavyUnderline>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          <div className="col-span-full flex flex-col items-center mb-6 space-y-6">
            <div className="flex flex-col items-center">
              <p className="text-sm font-medium mb-2">Number of Questions</p>
              <ToggleGroup
                type="single"
                value={questionCount}
                onValueChange={(value) => {
                  if (value) setQuestionCount(value);
                }}
                className="justify-center"
              >
                <ToggleGroupItem value="8" aria-label="8 questions">
                  8
                </ToggleGroupItem>
                <ToggleGroupItem value="16" aria-label="16 questions">
                  16
                </ToggleGroupItem>
                <ToggleGroupItem value="32" aria-label="32 questions">
                  32
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex flex-col items-center">
              <p className="text-sm font-medium mb-2">Question Type</p>
              <ToggleGroup
                type="single"
                value={questionType}
                onValueChange={(value: QuestionType) => {
                  if (value) setQuestionType(value);
                }}
                className="justify-center"
              >
                <ToggleGroupItem
                  value="in-which-book"
                  aria-label="In which book questions"
                >
                  In Which Book
                </ToggleGroupItem>
                <ToggleGroupItem value="content" aria-label="Content questions">
                  Content
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="both"
                  aria-label="Both types of questions"
                >
                  Both
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            <div className="col-span-full flex justify-center mb-4">
              Select your books
              <Button
                onClick={handleToggleAll}
                variant="outline"
                size="sm"
                className="w-32"
              >
                {selectAll ? "Clear All" : "Select All"}
              </Button>
            </div>
            {Object.entries(books).map(([key, book]) => (
              <div key={key} className="flex flex-col items-center">
                <div
                  className={`relative w-20 h-28 cursor-pointer transition-all duration-200 rounded-md overflow-hidden ${
                    selectedBookKeys.includes(key)
                      ? "ring-4 ring-purple-600"
                      : ""
                  }`}
                  onClick={() => handleToggleBook(key)}
                >
                  <Image
                    src={book.cover}
                    alt={book.title}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-md shadow-sm"
                  />
                  {(!isMobile || !selectedBookKeys.includes(key)) && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                      <p className="text-white text-center text-xs p-1">
                        {book.author}
                      </p>
                    </div>
                  )}
                  {selectedBookKeys.includes(key) && (
                    <div className="absolute inset-0 bg-purple-600 bg-opacity-30 flex items-center justify-center">
                      <PawPrint className="text-white w-6 h-6" />
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs font-medium text-center line-clamp-2 w-20">
                  {book.title}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="fixed bottom-0 left-0 right-0 p-4 md:static md:p-0 md:mt-4 flex justify-center">
        <Button
          onClick={handleSubmit}
          className="w-auto px-8 py-6 text-lg font-semibold group bg-cyan-400 hover:bg-cyan-500 transition-colors"
        >
          Start Battle
          <ArrowRight className="ml-2 h-8 w-8 animate-move-arrow" />
        </Button>
      </div>
    </div>
  );
}
