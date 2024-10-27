export type Question = {
  type: "in-which-book" | "content";
  text: string;
  book?: string;
  author?: string;
  answer: string;
  page: number;
};
