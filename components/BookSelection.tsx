"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";
import Image from "next/image";

const books = [
  {
    id: 1,
    title: "A Time Traveler's Theory of Relativity",
    author: "Nicole Valentine",
    cover: "/cover_images/time_travelers.jpg",
  },
  {
    id: 2,
    title: "Before the Ever After",
    author: "Jacqueline Woodson",
    cover: "/cover_images/before_the_ever_after.jpg",
  },
  {
    id: 3,
    title: "Circus Mirandus",
    author: "Cassie Beasley",
    cover: "/cover_images/circus_mirandus.jpg",
  },
  {
    id: 4,
    title: "Fifty-Four Things Wrong with Gwendolyn Rogers",
    author: "Caela Carter",
    cover: "/cover_images/54_things.jpg",
  },
  {
    id: 5,
    title: "Frizzy",
    author: "Claribel A. Ortega",
    cover: "/cover_images/frizzy.jpg",
  },
  {
    id: 6,
    title: "J.D. and the Great Barber Battle",
    author: "J. Dillard",
    cover: "/cover_images/jd_barber.jpg",
  },
  {
    id: 7,
    title: "Just Jerry: How Drawing Shaped My Life",
    author: "Jerry Pinkney",
    cover: "/cover_images/just_jerry.jpg",
  },
  {
    id: 8,
    title: "Leonard (My Life as a Cat)",
    author: "Carlie Sorosiak",
    cover: "/cover_images/leonard_cat.jpg",
  },
  {
    id: 9,
    title: "Marshmallow & Jordan",
    author: "Alina Chau",
    cover: "/cover_images/marshmallow_jordan.jpg",
  },
  {
    id: 10,
    title: "Sam Makes a Splash",
    author: "Nicole Melleby",
    cover: "/cover_images/sam_makes_a_splash.jpg",
  },
  {
    id: 11,
    title: "Solimar: The Sword of the Monarchs",
    author: "Pam Munoz Ryan",
    cover: "/cover_images/solimar.jpg",
  },
  {
    id: 12,
    title: "The Mystwick School of Musicraft",
    author: "Jessica Koury",
    cover: "/cover_images/mystwick_music.jpg",
  },
  {
    id: 13,
    title: "The Name of This Book Is Secret",
    author: "Pseudonymous Bosch",
    cover: "/cover_images/the_name_of_this_book_is_secret.jpg",
  },
  {
    id: 14,
    title: "The Wild Robot",
    author: "Peter Brown",
    cover: "/cover_images/wild_robot.jpg",
  },
  {
    id: 15,
    title: "Thirst",
    author: "Varsha Bajaj",
    cover: "/cover_images/thirst.jpg",
  },
  {
    id: 16,
    title: "Twins",
    author: "Varian Johnson & Shannon Wright",
    cover: "/cover_images/twins.jpg",
  },
];

type BookSelectionProps = {
  onSelectBooks: (selectedBooks: string[]) => void;
};

export default function BookSelection({ onSelectBooks }: BookSelectionProps) {
  const [selectedBooks, setSelectedBooks] = useState<number[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    const checkIfMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const handleToggleBook = (bookId: number) => {
    setSelectedBooks((prev) =>
      prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId]
    );
  };

  const handleSelectAll = () => {
    setSelectedBooks(books.map((book) => book.id));
  };

  const handleDeselectAll = () => {
    setSelectedBooks([]);
  };

  const handleSubmit = () => {
    const selectedTitles = books
      .filter((book) => selectedBooks.includes(book.id))
      .map((book) => book.title);
    onSelectBooks(
      selectedTitles.length === 0
        ? books.map((book) => book.title)
        : selectedTitles
    );
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0 relative">
      <Card className="w-full max-w-6xl mx-auto mb-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Select Books for Quiz
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          {" "}
          {/* Update: Added sm:p-4 */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-3">
            {" "}
            {/* No changes needed here based on the provided updates */}
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
            {books.map((book) => (
              <div key={book.id} className="flex flex-col items-center">
                <div
                  className={`relative w-24 h-36 cursor-pointer transition-all duration-200 rounded-md overflow-hidden ${
                    selectedBooks.includes(book.id)
                      ? "ring-4 ring-purple-600"
                      : ""
                  }`}
                  onClick={() => handleToggleBook(book.id)}
                >
                  <Image
                    src={book.cover}
                    alt={book.title}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-md shadow-sm"
                  />
                  {(!isMobile || !selectedBooks.includes(book.id)) && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                      <p className="text-white text-center text-xs p-1">
                        {book.author}
                      </p>
                    </div>
                  )}
                  {selectedBooks.includes(book.id) && (
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
          className="w-auto px-8 py-6 text-lg font-semibold group bg-cyan-400 "
        >
          Start Quiz
          <ArrowRight className="ml-2 h-8 w-8 animate-move-arrow" />
        </Button>
      </div>
    </div>
  );
}
