import { BookHeart, Dot } from "lucide-react";
import RosieIcon from "./RosieIcon";
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white text-black p-4 shadow-sm">
      <div className="container mx-auto flex justify-center">
        <Link href="/" className="inline-flex items-center">
          <BookHeart className="w-6 h-6" />
          <Dot className="w-6 h-6" />
          <RosieIcon className="w-6 h-6" />
        </Link>
      </div>
    </header>
  );
}
