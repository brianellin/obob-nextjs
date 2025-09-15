"use client";

import { Dot, Menu } from "lucide-react";
import RosieIcon from "./RosieIcon";
import Link from "next/link";
import { track } from "@vercel/analytics";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import BookHeartIcon from "./BookHeartIcon";

export default function Header() {
  const handleBlueskyClick = () => {
    track("blueskyClick");
    window.open("https://bsky.app/profile/obob.dog", "_blank");
  };

  return (
    <header className="bg-white text-black p-4 shadow-sm">
      <div className="container mx-auto flex justify-center items-center relative">
        <Link href="/" className="inline-flex items-center">
          <BookHeartIcon className="w-6 h-6" />
          <Dot className="w-6 h-6" />
          <RosieIcon className="w-6 h-6" />
        </Link>

        <div className="absolute right-0">
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                <Menu className="w-6 h-6" />
                <span className="sr-only">Open menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>OBOB.dog</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-6 mt-8">
                <SheetClose asChild>
                  <Link
                    href="/"
                    className="text-lg hover:text-gray-600 transition-colors"
                  >
                    Home / New Battle
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/books"
                    className="text-lg hover:text-gray-600 transition-colors flex items-center gap-2"
                  >
                    Books &amp; Questions
                    <span className="px-2 py-1 text-xs font-bold text-white bg-pink-500 rounded-full">
                      NEW!
                    </span>
                  </Link>
                </SheetClose>

                <SheetClose asChild>
                  <button
                    onClick={handleBlueskyClick}
                    className="text-lg hover:text-gray-600 transition-colors text-left"
                  >
                    News / Blog
                  </button>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/about"
                    className="text-lg hover:text-gray-600 transition-colors"
                  >
                    About
                  </Link>
                </SheetClose>
              </nav>
              <div className="mt-8 flex justify-center">
                <RosieIcon className="w-8 h-8" />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
