export interface Book {
  book_key: string;
  title: string;
  author: string;
  cover: string;
  obob_division: "3-5" | "6-8" | "9-12";
  obob_year: "2024-2025";
}

export type Books = {
  [key: string]: Book;
};

export type QuestionSource = {
  name: string;
  link: string;
};

export type BaseQuestion = {
  type: "in-which-book" | "content";
  text: string;
  book_key: string;
  page: number;
  source?: QuestionSource;
};

export type InWhichBookQuestion = BaseQuestion & {
  type: "in-which-book";
};

export type ContentQuestion = BaseQuestion & {
  type: "content";
  answer: string;
};

export type Question = InWhichBookQuestion | ContentQuestion;

export type QuestionWithBook = {
  book: Book;
  page: number;
  text: string;
  source?: QuestionSource;
} & (
  | { type: "in-which-book" }
  | { type: "content"; answer: string }
);
