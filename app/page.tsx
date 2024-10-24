import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import ModeSelection from "@/components/ModeSelection";

export default function Home() {
  return (
    <main className="min-h-screen bg-white p-2">
      <Card className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to OBOB.dog!</CardTitle>
          <CardDescription className="text-white text-lg">
            Your fun practice buddy for Oregon Battle of the Books
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg">
            Ready to become an OBOB champion? Choose your adventure below and
            start your journey through amazing books!
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/about" passHref>
            <Button
              variant="secondary"
              className="text-black hover:text-white transition-colors"
            >
              Learn More <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>

      <ModeSelection />
    </main>
  );
}