"use client";

import { useState, useEffect } from "react";
import { track } from "@vercel/analytics";

export default function DonationBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const bannerDismissed = localStorage.getItem("donationBannerDismissed");
    if (bannerDismissed) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    track("donationBannerDismiss");
    setIsVisible(false);
    localStorage.setItem("donationBannerDismissed", "true");
  };

  const handleDonationClick = () => {
    track("donationBannerClick");
    window.open("https://donate.stripe.com/aEU9Eyb3nd9Q0ve9AA", "_blank");
  };

  if (!isVisible) return null;

  return (
    <div className="bg-pink-500 px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex justify-center items-center relative">
        <div
          onClick={handleDonationClick}
          className="flex items-center gap-4 pr-12 max-w-full cursor-pointer hover:opacity-90"
        >
          <span className="text-2xl flex-shrink-0 animate-wave inline-block origin-[75%_80%]">
            👋
          </span>
          <p className="text-white text-sm font-medium">
            Enjoying obob.dog? Consider a{" "}
            <span className="underline">donation</span> to the Glencoe PTA.
          </p>
        </div>
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
