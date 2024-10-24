import { Dog } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="bg-white text-black p-4 shadow-sm">
      <div className="container mx-auto">
        <Link
          href="/"
          className="flex items-center justify-center hover:text-blue-500 transition-colors"
        >
          <Dog className="w-6 h-6 mr-2" />
          <h1 className="text-xl font-bold">obob.dog woof!</h1>
        </Link>
      </div>
    </header>
  );
}
