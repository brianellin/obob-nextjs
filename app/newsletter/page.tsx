import { Metadata } from "next";
import { WavyUnderline } from "@/components/WavyUnderline";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import NewsletterSignupForm from "@/components/NewsletterSignupForm";

export const metadata: Metadata = {
  title: "Newsletter | OBOB.dog",
  description:
    "Sign up for the OBOB.dog mailing list to get updates on new features, questions, and OBOB news.",
};

export default function NewsletterPage() {
  return (
    <div className="container mx-auto max-w-md px-4 py-4">
      <h1 className="text-4xl font-bold text-center mb-8">
        <WavyUnderline style={0} thickness={4} color="text-yellow-900">
          Stay in the Loop!
        </WavyUnderline>
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Join the OBOB.dog Newsletter
          </CardTitle>
          <CardDescription>
            Get occasional updates from OBOB.dog about new games, battle
            features, and new questions. We won&apos;t ever share or sell your info.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewsletterSignupForm />
        </CardContent>
      </Card>
    </div>
  );
}
