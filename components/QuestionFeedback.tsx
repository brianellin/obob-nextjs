"use client";

import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";

type QuestionFeedbackButtonProps = {
  onClick: () => void;
};

export default function QuestionFeedbackButton({
  onClick,
}: QuestionFeedbackButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
      onClick={onClick}
    >
      <Flag className="h-4 w-4" />
      <span className="sr-only">Report question issue</span>
    </Button>
  );
}
