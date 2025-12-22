import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-6 text-center text-sm text-gray-400">
      <Link href="/about" className="hover:text-gray-600 transition-colors">
        About
      </Link>
      <span className="mx-2">&middot;</span>
      <Link
        href="/newsletter"
        className="hover:text-gray-600 transition-colors"
      >
        Newsletter signup
      </Link>
    </footer>
  );
}
