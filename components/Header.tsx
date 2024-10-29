import { BookHeart, Dog, Dot } from "lucide-react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white text-black p-4 shadow-sm">
      <div className="container mx-auto flex justify-center">
        <Link href="/" className="inline-flex items-center">
          <BookHeart className="w-5 h-5" />
          <Dot className="w-5 h-5" />
          <Dog className="w-5 h-5" />
        </Link>
      </div>
    </header>
  );
}
