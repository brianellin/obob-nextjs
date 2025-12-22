"use client";

import { useState, useEffect } from "react";
import { track } from "@vercel/analytics";
import { usePostHog } from "posthog-js/react";
import Link from "next/link";

export default function NewsletterBanner() {
  const posthog = usePostHog();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const bannerDismissed = localStorage.getItem("newsletterBannerDismissed");
    if (bannerDismissed) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    track("newsletterBannerDismiss");
    posthog.capture("newsletterBannerDismiss");
    setIsVisible(false);
    localStorage.setItem("newsletterBannerDismissed", "true");
  };

  const handleClick = () => {
    track("newsletterBannerClick");
    posthog.capture("newsletterBannerClick");
  };

  if (!isVisible) return null;

  return (
    <div className="bg-pink-500 px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex justify-center items-center relative">
        <Link
          href="/newsletter"
          onClick={handleClick}
          className="flex items-center gap-4 pr-12 max-w-full hover:opacity-90"
        >
          <span className="text-2xl flex-shrink-0">📬</span>
          <p className="text-white text-sm font-medium">
            Stay in the loop! <span className="underline">Sign up</span> for the
            obob.dog newsletter.
          </p>
        </Link>
        <button
          onClick={handleDismiss}
          className="text-white hover:text-opacity-70 focus:outline-none absolute right-0"
          aria-label="Dismiss banner"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
