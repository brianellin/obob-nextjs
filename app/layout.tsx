import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title:
    "obob.dog - read, practice, and have fun with Oregon Battle of the Books",
  description:
    "obob.dog is a new way to explore Oregon Battle of the Books (OBOB) questions and test your knowledge with fun battles.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main className="container mx-auto px-2 py-2">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
