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

    // Get puzzle size config
    const sizeConfig = PUZZLE_SIZE_CONFIG[puzzleSize];

    if (validQuestions.length < sizeConfig.minWords) {
      return NextResponse.json(
        {
          error:
            `Not enough single-word content questions available for the selected books. Need at least ${sizeConfig.minWords} questions, but only found ${validQuestions.length}. Please select more books or try different books.`,
          availableCount: validQuestions.length,
        },
        { status: 400 }
      );
    }

    // Select distributed questions across books - get plenty of candidates
    // Give the generator 2x the target to have good options for density optimization
    const candidateCount = Math.min(
      validQuestions.length,
      sizeConfig.targetWords * 2
    );
    const candidateQuestions = selectDistributedQuestions(
      validQuestions,
      candidateCount
    );

    // Generate the crossword puzzle optimizing for density
    const puzzle = generateCrossword(candidateQuestions, {
      targetWords: sizeConfig.targetWords,
      maxGridSize: sizeConfig.maxGridSize,
      minWords: sizeConfig.minWords,
    });

    if (!puzzle) {
      return NextResponse.json(
        {
          error:
            "Unable to generate a crossword puzzle with the available questions. Please try again or select different books.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      puzzle: {
        ...puzzle,
        // Convert Map to object for JSON serialization
        cellNumbers: Object.fromEntries(puzzle.cellNumbers),
      },
      placedWordCount: puzzle.clues.length,
      gridSize: puzzle.rows,
    });
  } catch (error) {
    console.error("Error generating crossword:", error);
    return NextResponse.json(
      { error: "Failed to generate crossword puzzle" },
      { status: 500 }
    );
  }
}
