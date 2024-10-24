import Image from "next/image";
import Link from "next/link";
import { Github, Heart } from "lucide-react";
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
    <div className="container mx-auto px-4 py-4">
      <h1 className="text-4xl font-bold text-center mb-8">Woof!</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>What is obob.dog?</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              obob.dog is a fun and interactive quiz app designed to help
              students practice for the Oregon Battle of the Books (OBOB)
              competition. It&apos;s a{" "}
              <WavyUnderline thickness={3} color="text-green-500">
                paw-some
              </WavyUnderline>{" "}
              way to test your knowledge of OBOB books and prepare for the real
              battle!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open Source Project</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              This project is open source and available on GitHub. Feel free to
              contribute, report issues, or suggest improvements!
            </p>
            <Button asChild>
              <Link
                href="https://github.com/brianellin/obob-nextjs"
                className="inline-flex items-center"
              >
                <Github className="mr-2 h-4 w-4" /> View on GitHub
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support the Project</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Enjoying obob.dog? Consider donating to the Glencoe PTA to support
              educational initiatives like OBOB!
            </p>
            <Button asChild>
              <Link
                href="https://glencoe-pta-donation-link.com"
                className="inline-flex items-center"
              >
                <Heart className="mr-2 h-4 w-4" /> Donate to Glencoe PTA
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meet Rosie</CardTitle>
            <CardDescription>The inspiration behind obob.dog</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Image
              src="/rosie.jpeg"
              alt="Rosie the dog"
              className="rounded-lg"
              width={1527}
              height={1422}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
