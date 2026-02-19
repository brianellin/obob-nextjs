"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import DownloadAgreementDialog from "@/components/DownloadAgreementDialog";

interface DownloadAllQuestionsButtonProps {
  year: string;
  division: string;
}

export default function DownloadAllQuestionsButton({
  year,
  division,
}: DownloadAllQuestionsButtonProps) {
  return (
    <DownloadAgreementDialog
      downloadUrl={`/exports/${year}/${division}/obob-${year}-${division}-all-questions.csv`}
      fileName={`obob-${year}-${division}-all-questions.csv`}
    >
      <Button variant="outline" size="sm">
        <Download className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline">Download All Questions</span>
      </Button>
    </DownloadAgreementDialog>
  );
}
