import { BookHeart, Dog } from "lucide-react";
import { WavyUnderline } from "./WavyUnderline";
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white text-black p-4 shadow-sm">
      <div className="container mx-auto flex justify-center">
        <Link href="/" className="inline-flex items-center">
          <BookHeart className="w-5 h-5 mr-2" />

          <h1 className="text-xl font-bold">
            <WavyUnderline style={0} thickness={3} color="text-fuchsia-500">
              obob.dog
            </WavyUnderline>
          </h1>
          <Dog className="w-5 h-5 ml-2" />
        </Link>
      </div>
    </header>
  );
}
