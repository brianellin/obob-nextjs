"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";

export default function Footer() {
  const handleBlueskyClick = () => {
    track("blueskyClick");
    window.open("https://bsky.app/profile/obob.dog", "_blank");
  };

  return (
    <footer className="py-6 text-center text-sm text-gray-700">
      <div className="space-x-3">
        <Link href="/about" className="hover:text-black transition-colors">
          About
        </Link>
        <span className="text-gray-400 select-none">&middot;</span>
        <button
          onClick={handleBlueskyClick}
          className="hover:text-black transition-colors"
        >
          @obob.dog
        </button>
      </div>
    </footer>
  );
}
