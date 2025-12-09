import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { Book } from "@/types";
import { getAllQuestions } from "@/lib/questions";
import {
  filterCrosswordQuestions,
  selectDistributedQuestions,
} from "@/lib/crossword/utils";
import { generateCrossword } from "@/lib/crossword/generator";
import { PUZZLE_SIZE_CONFIG, PuzzleSize } from "@/lib/crossword/types";

export async function POST(request: Request) {
  try {
    const { selectedBooks, puzzleSize = "medium", year, division } =
      (await request.json()) as {
        selectedBooks: Book[];
        puzzleSize: PuzzleSize;
        year: string;
        division: string;
      };

    const booksPath = path.join(
      process.cwd(),
      "public",
      "obob",
      year,
      division,
      "books.json"
    );

    const [allQuestions, booksFile] = await Promise.all([
      getAllQuestions(year, division),
      fs.readFile(booksPath, "utf8"),
    ]);

    const booksData = JSON.parse(booksFile) as { books: Record<string, Book> };
    const books = Object.values(booksData.books);

    // Get selected book keys
    const selectedBookKeys = selectedBooks.map((b) => b.book_key);

    // Filter to valid crossword questions (content type, single-word answers)
    const validQuestions = filterCrosswordQuestions(
      allQuestions,
      selectedBookKeys,
      books
    );

    if (validQuestions.length < 4) {
      return NextResponse.json(
        {
          error:
            "Not enough single-word content questions available for the selected books. Please select more books or try different books.",
          availableCount: validQuestions.length,
        },
        { status: 400 }
      );
    }

    // Get target word count based on puzzle size
    const sizeConfig = PUZZLE_SIZE_CONFIG[puzzleSize];
    const targetCount = Math.min(sizeConfig.target, validQuestions.length);

    // Select 2.5x more candidate words than needed for better density optimization
    // The generator will try different combinations to find the densest layout
    const candidateCount = Math.min(
      Math.ceil(targetCount * 2.5),
      validQuestions.length
    );
    const candidateQuestions = selectDistributedQuestions(
      validQuestions,
      candidateCount
    );

    // Generate the crossword puzzle with density optimization
    // Pass the target count so the generator knows how many words we want
    const puzzle = generateCrossword(candidateQuestions, targetCount);

    if (!puzzle) {
      return NextResponse.json(
        {
          error:
            "Unable to generate a crossword puzzle with the available questions. Please try again or select different books.",
        },
        { status: 400 }
      );
    }

    // Build message if we couldn't place all requested words
    let message: string | null = null;
    if (puzzle.clues.length < sizeConfig.target) {
      message = `Generated a puzzle with ${puzzle.clues.length} words (requested ${sizeConfig.target}). Some words couldn't be placed in the grid.`;
    }

    return NextResponse.json({
      puzzle: {
        ...puzzle,
        // Convert Map to object for JSON serialization
        cellNumbers: Object.fromEntries(puzzle.cellNumbers),
      },
      message,
      placedWordCount: puzzle.clues.length,
      requestedWordCount: sizeConfig.target,
    });
  } catch (error) {
    console.error("Error generating crossword:", error);
    return NextResponse.json(
      { error: "Failed to generate crossword puzzle" },
      { status: 500 }
    );
  }
}
