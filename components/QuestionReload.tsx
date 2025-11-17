"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type QuestionReloadButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

export default function QuestionReloadButton({
  onClick,
  disabled = false,
}: QuestionReloadButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={onClick}
      disabled={disabled}
    >
      <RefreshCw className="h-4 w-4" />
      <span className="sr-only">Reload question</span>
    </Button>
  );
}
