import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-6 text-center text-sm text-gray-400 space-y-2">
      <div>
        <Link href="/about" className="hover:text-gray-600 transition-colors">
          About
        </Link>
        <span className="mx-2">&middot;</span>
        <Link
          href="/newsletter"
          className="hover:text-gray-600 transition-colors"
        >
          Newsletter
        </Link>
        <span className="mx-2">&middot;</span>
        <Link href="/privacy" className="hover:text-gray-600 transition-colors">
          Privacy
        </Link>
        <span className="mx-2">&middot;</span>
        <Link href="/terms" className="hover:text-gray-600 transition-colors">
          Terms
        </Link>
      </div>
      <div className="text-xs text-gray-300">
        &copy; {new Date().getFullYear()}{" "}
        <Link
          href="https://doing.systems"
          className="hover:text-gray-500 transition-colors"
        >
          Doing Systems, LLC
        </Link>
        <span className="mx-2">&middot;</span>
        Not affiliated with Oregon Battle of the Books
      </div>
    </footer>
  );
}
