"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { Book, Books } from "../types";

type BookSelectionProps = {
  onSelectBooks: (selectedBooks: Book[]) => void;
};

export default function BookSelection({ onSelectBooks }: BookSelectionProps) {
  const [books, setBooks] = useState<Books>({});
  const [selectedBookKeys, setSelectedBookKeys] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    const checkIfMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    const fetchBooks = async () => {
      try {
        const response = await fetch("/api/books");
        const data = await response.json();
        setBooks(data.books);
      } catch (error) {
        console.error("Error loading books:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();

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

  const handleSubmit = () => {
    const selectedBooks = selectedBookKeys.map((key) => ({
      ...books[key],
      book_key: key, // Changed from bookKey to book_key
    }));
    onSelectBooks(
      selectedBooks.length === 0
        ? Object.entries(books).map(([key, book]) => ({
            ...book,
            book_key: key, // Changed from bookKey to book_key
          }))
        : selectedBooks
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 relative">
      <Card className="w-full max-w-6xl mx-auto mb-4 border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Select Books
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-3">
            <div className="col-span-full flex justify-between mb-4">
              <Button
                onClick={handleSelectAll}
                variant="outline"
                size="sm"
                className="w-[calc(50%-0.375rem)]"
              >
                Select All
              </Button>
              <Button
                onClick={handleDeselectAll}
                variant="outline"
                size="sm"
                className="w-[calc(50%-0.375rem)]"
              >
                Deselect All
              </Button>
            </div>
            {Object.entries(books).map(([key, book]) => (
              <div key={key} className="flex flex-col items-center">
                <div
                  className={`relative w-24 h-36 cursor-pointer transition-all duration-200 rounded-md overflow-hidden ${
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
                      <CheckCircle className="text-white w-8 h-8" />
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs font-medium text-center line-clamp-2 w-24">
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
