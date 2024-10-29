import { PawPrintIcon } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-6 text-center text-sm text-gray-700">
      <Link href="/about" className="hover:text-black transition-colors">
        About obob.dog
      </Link>
    </footer>
  );
}
