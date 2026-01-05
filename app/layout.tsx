import "./globals.css";
import type { Metadata } from "next";
import { Inter, Playfair_Display, Rampart_One } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsletterBanner from "@/components/NewsletterBanner";
import { Analytics } from "@vercel/analytics/react";
import { PostHogProvider } from "./providers";

const inter = Inter({ subsets: ["latin"] });
export const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-playfair",
});

const rampartOne = Rampart_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-rampart",
});

export const metadata: Metadata = {
  title: "OBOB Questions and Battles",
  description:
    "Practice questions and interactive battles for Oregon Battle of the Books (OBOB)! Test your knowledge and battle on your own or with a friend/parent.",
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
        <link
          rel="alternate"
          type="application/rss+xml"
          title="OBOB.dog Blog"
          href="/feed.xml"
        />
      </head>
      <body className={`${inter.className} ${playfairDisplay.variable} ${rampartOne.variable}`}>
        <PostHogProvider>
          <NewsletterBanner />
          <Header />
          <main className="container mx-auto px-2 py-2">{children}</main>
          <Footer />
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}
