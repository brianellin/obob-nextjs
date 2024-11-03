import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "obob.dog - Oregon Battle of the Books Practice Battles",
  description:
    "Practice battles for Oregon Battle of the Books! Test your knowledge in solo or friend/parent battles.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="/icon?<generated>"
          type="image/png"
          sizes="32x32"
        />
      </head>
      <body className={inter.className}>
        <Header />
        <main className="container mx-auto px-2 py-2">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
