import Image from "next/image";
import Link from "next/link";
import { BookOpen, Github, Mail } from "lucide-react";
import { WavyUnderline } from "@/components/WavyUnderline";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-4">
      <h1 className="text-4xl font-bold text-center mb-8">
        <WavyUnderline style={0} thickness={4} color="text-yellow-900">
          Woof!
        </WavyUnderline>
      </h1>

      <div className="flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle>What the ruff?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-7 [&:not(:first-child)]:mt-6">
              obob.dog is a new way to explore Oregon Battle of the Books (OBOB)
              questions and test your knowledge.
            </p>
            <p className="leading-7 [&:not(:first-child)]:mt-6">
              Battles are 8 questions: 4{" "}
              <span className="font-bold">in which book</span> questions,
              followed by 4 <span className="font-bold">content</span>{" "}
              questions, similar to what you&apos;d experience in a real OBOB
              battle.
            </p>

            <Button asChild className="w-full mt-4">
              <Link
                href="https://www.oregonbattleofthebooks.org/"
                className="inline-flex items-center"
              >
                <BookOpen className="mr-2 h-4 w-4" /> Learn more about OBOB
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Where do the questions come from?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-7 [&:not(:first-child)]:mt-6">
              We collect questions from various schools and libraries across
              Oregon that have posted them publicly (usually as PDFs or
              spreadsheets). Here&apos;s the current list of sources:
            </p>
            <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
              <li>
                <Link
                  href="https://library.cedarmill.org/kids/obob/"
                  className="hover:underline"
                >
                  Cedar Mill Library
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.ci.oswego.or.us/kids/obob-practice-questions"
                  className="hover:underline"
                >
                  Lake Oswego Library
                </Link>
              </li>

              <li>OBOB Practice-Question Coalition</li>
            </ul>
            <p className="leading-7 [&:not(:first-child)]:mt-6">
              Each question in the battle cites its source. If you are
              interested in contributing questions, please get in touch! Email
              us at{" "}
              <a href="mailto:obobdotdog@gmail.com">obobdotdog@gmail.com</a>
            </p>

            <p className="leading-7 [&:not(:first-child)]:mt-6">
              Take a look at the{" "}
              <Link href="/books" className="hover:underline">
                Books
              </Link>{" "}
              page to see a summary of questions by book, and where each one
              comes from.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Who made this?</CardTitle>
            <CardDescription></CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2 flex-col">
            <p className="">
              {" "}
              Made with 💚 by Rosie, Gianna, and Brian (Glencoe Elementary).
            </p>
            <Image
              src="/rosie.jpeg"
              alt="Rosie the dog"
              className="rounded-lg"
              width={1527}
              height={1422}
            />
            <p className="mt-4">
              obob.dog is open source. Feel free to contribute, report issues,
              or make your own version!
            </p>
            <Button asChild>
              <Link
                href="https://github.com/brianellin/obob-nextjs"
                className="inline-flex items-center"
              >
                <Github className="mr-2 h-4 w-4" /> View on GitHub
              </Link>
            </Button>

            <Button asChild variant="outline">
              <Link
                href="mailto:obobdotdog@gmail.com"
                className="inline-flex items-center"
              >
                <Mail className="mr-2 h-4 w-4" /> Email Us
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
