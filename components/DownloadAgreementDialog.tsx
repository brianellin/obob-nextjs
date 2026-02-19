"use client";

import React, { useState } from "react";
import { usePostHog } from "posthog-js/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

interface DownloadAgreementDialogProps {
  downloadUrl: string;
  fileName?: string;
  children: React.ReactNode;
}

export default function DownloadAgreementDialog({
  downloadUrl,
  fileName,
  children,
}: DownloadAgreementDialogProps) {
  const [agreed, setAgreed] = useState(false);
  const [open, setOpen] = useState(false);
  const posthog = usePostHog();

  const handleDownload = () => {
    posthog?.capture("downloadAgreed", {
      fileName: fileName || downloadUrl,
    });
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) setAgreed(false);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download License Agreement</DialogTitle>
          <DialogDescription>
            These questions are shared under a Creative Commons license.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* CC BY-NC 4.0 Badge */}
          <div className="flex justify-center">
            <img
              src="https://licensebuttons.net/l/by-nc/4.0/88x31.png"
              alt="CC BY-NC 4.0"
              width={88}
              height={31}
            />
          </div>

          {/* License Terms */}
          <div className="space-y-3 text-sm text-slate-700">
            <p className="font-semibold">
              By downloading, you agree to the{" "}
              <Link
                href="https://creativecommons.org/licenses/by-nc/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600"
              >
                CC BY-NC 4.0
              </Link>{" "}
              license:
            </p>
            <ul className="space-y-2 ml-1">
              <li className="flex gap-2">
                <span className="font-bold text-base leading-5">1.</span>
                <span>
                  <strong>Non-commercial use only.</strong> You may not use
                  these questions for any commercial purpose.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-base leading-5">2.</span>
                <span>
                  <strong>Attribution required.</strong> When using questions in
                  derivative works (apps, games, tools, flashcards, etc.), you
                  must credit <strong>obob.dog</strong> and the original
                  question source.
                </span>
              </li>
            </ul>
          </div>

          {/* Checkbox */}
          <div className="flex items-start space-x-2 pt-2 border-t">
            <Checkbox
              id="license-agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <label
              htmlFor="license-agree"
              className="text-sm leading-snug cursor-pointer select-none"
            >
              I agree to use these questions under the{" "}
              <Link
                href="https://creativecommons.org/licenses/by-nc/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600"
              >
                CC BY-NC 4.0
              </Link>{" "}
              license terms and the{" "}
              <Link href="/terms" target="_blank" className="underline text-blue-600">
                Terms of Service
              </Link>
              .
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDownload} disabled={!agreed}>
            Agree & Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
