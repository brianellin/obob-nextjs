import "./globals.css";
import type { Metadata } from "next";
import { Nunito, Nunito_Sans, Rampart_One, Libre_Baskerville } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsletterBanner from "@/components/NewsletterBanner";
import { Analytics } from "@vercel/analytics/react";
import { PostHogProvider } from "./providers";
import { ThemeProvider } from "next-themes";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-nunito-sans",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
});

const rampartOne = Rampart_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-rampart",
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-libre-baskerville",
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
    <html lang="en" suppressHydrationWarning>
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
      <body className={`${nunitoSans.className} ${nunitoSans.variable} ${nunito.variable} ${rampartOne.variable} ${libreBaskerville.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <PostHogProvider>
            <NewsletterBanner />
            <Header />
            <main className="container mx-auto px-2 py-2">{children}</main>
            <Footer />
          </PostHogProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
