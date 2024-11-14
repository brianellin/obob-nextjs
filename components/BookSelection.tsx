"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, PawPrint } from "lucide-react";
import Image from "next/image";
import { Book, Books } from "../types";
import { WavyUnderline } from "./WavyUnderline";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type QuestionType = "in-which-book" | "content" | "both";

type BookSelectionProps = {
  onSelectBooks: (
    selectedBooks: Book[],
    questionCount: number,
    questionType: QuestionType
  ) => void;
  year: string;
  division: string;
};

export default function BookSelection({
  onSelectBooks,
  year,
  division,
}: BookSelectionProps) {
  const [books, setBooks] = useState<Books>({});
  const [selectedBookKeys, setSelectedBookKeys] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [questionCount, setQuestionCount] = useState<string>("8");
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

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const response = await fetch(`/obob/${year}/${division}/books.json`);
        const data = await response.json();
        setBooks(data.books);
      } catch (error) {
        console.error("Error loading books:", error);
      }
    };

    loadBooks();
  }, [year, division]);

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

  if (Object.keys(books).length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading books...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 relative">
      <Card className="w-full max-w-6xl mx-auto border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            <WavyUnderline style={0} thickness={4} color="text-lime-400">
              Pick your battle{" "}
            </WavyUnderline>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            <div className="col-span-full flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Select your books</h2>
              <Button
                onClick={handleToggleAll}
                variant="outline"
                size="sm"
                className="w-32"
              >
                {selectAll ? "Clear" : "Select All"}
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
          <div className="bg-slate-50 p-4 rounded-md mt-6 md:mt-8  md:max-w-lg md:mx-auto">
            <div className="col-span-full flex flex-col items-center space-y-6 ">
              <div className="flex flex-row items-center justify-between w-full">
                <p className="text-sm font-bold">How many questions?</p>
                <ToggleGroup
                  type="single"
                  value={questionCount}
                  onValueChange={(value) => {
                    if (value) setQuestionCount(value);
                  }}
                  className="justify-center"
                >
                  <ToggleGroupItem
                    value="8"
                    aria-label="8 questions"
                    className="data-[state=on]:bg-purple-600 data-[state=on]:text-white"
                  >
                    8
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="16"
                    aria-label="16 questions"
                    className="data-[state=on]:bg-purple-600 data-[state=on]:text-white"
                  >
                    16
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="32"
                    aria-label="32 questions"
                    className="data-[state=on]:bg-purple-600 data-[state=on]:text-white"
                  >
                    32
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="flex flex-row items-center justify-between w-full">
                <p className="text-sm font-bold">Question type</p>
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
                    className="data-[state=on]:bg-purple-600 data-[state=on]:text-white"
                  >
                    In Which Book
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="content"
                    aria-label="Content questions"
                    className="data-[state=on]:bg-purple-600 data-[state=on]:text-white"
                  >
                    Content
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="both"
                    aria-label="Both types of questions"
                    className="data-[state=on]:bg-purple-600 data-[state=on]:text-white"
                  >
                    All
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="p-4 flex justify-center">
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
