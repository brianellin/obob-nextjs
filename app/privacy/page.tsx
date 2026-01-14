import Link from "next/link";
import { Shield } from "lucide-react";
import { WavyUnderline } from "@/components/WavyUnderline";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Privacy Policy | OBOB.dog",
  description: "Privacy Policy for OBOB.dog - Oregon Battle of the Books practice tool",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-4">
      <h1 className="text-4xl font-bold text-center mb-8 font-rampart">
        <WavyUnderline style={0} thickness={4} color="text-yellow-900">
          Privacy Policy
        </WavyUnderline>
      </h1>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Who We Are
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-7">
              OBOB.dog is operated by <strong>Doing Systems, LLC</strong>, an Oregon limited
              liability company. We provide a free educational tool to help students practice
              for the Oregon Battle of the Books (OBOB) competition.
            </p>
            <p className="leading-7 text-sm text-slate-600">
              <strong>Contact:</strong>{" "}
              <Link href="mailto:obobdotdog@gmail.com" className="underline">
                obobdotdog@gmail.com
              </Link>
            </p>
            <p className="leading-7 text-sm text-slate-600">
              <strong>Effective Date:</strong> January 2025
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Automatically Collected</h3>
              <ul className="ml-6 list-disc [&>li]:mt-2 text-slate-700">
                <li>
                  <strong>Analytics data:</strong> We use PostHog and Vercel Analytics to
                  understand how our site is used. This includes page views, feature usage,
                  and general interaction patterns.
                </li>
                <li>
                  <strong>Session identifiers:</strong> For the Daily Crossword feature, we
                  create temporary session identifiers that expire after 24 hours. These help
                  you stay connected to your team during a play session.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Information You Provide</h3>
              <ul className="ml-6 list-disc [&>li]:mt-2 text-slate-700">
                <li>
                  <strong>Feedback forms:</strong> If you submit feedback about questions or
                  the crossword, you may optionally provide an email address for follow-up.
                </li>
                <li>
                  <strong>Question submissions:</strong> If you contribute practice questions,
                  we collect your name, email, and attribution information.
                </li>
                <li>
                  <strong>Newsletter:</strong> If you sign up for our newsletter, we collect
                  your email address.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Daily Crossword Feature</h3>
              <ul className="ml-6 list-disc [&>li]:mt-2 text-slate-700">
                <li>
                  <strong>Team codes:</strong> Random codes (like &ldquo;BARK42&rdquo;) that
                  let your team collaborate on puzzles.
                </li>
                <li>
                  <strong>Nicknames:</strong> Auto-generated fun names (like &ldquo;Blue
                  Pup&rdquo;) - we never ask for real names.
                </li>
                <li>
                  <strong>Puzzle progress:</strong> Your team&apos;s answers, stored temporarily
                  for 7 days.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Children&apos;s Privacy (COPPA)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-7">
              OBOB.dog is designed for students practicing for Oregon Battle of the Books,
              including children under 13. We take children&apos;s privacy seriously and comply
              with the Children&apos;s Online Privacy Protection Act (COPPA).
            </p>

            <div>
              <h3 className="font-semibold mb-2">What We Collect from Children</h3>
              <ul className="ml-6 list-disc [&>li]:mt-2 text-slate-700">
                <li>Temporary session identifiers that expire after 24 hours</li>
                <li>Auto-generated nicknames that cannot identify a child</li>
                <li>Crossword puzzle answers during collaborative play</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">What We DO NOT Collect from Children</h3>
              <ul className="ml-6 list-disc [&>li]:mt-2 text-slate-700">
                <li>Names, email addresses, or other contact information</li>
                <li>Persistent identifiers that track children across sessions</li>
                <li>Voice recordings (voice chat is live and not recorded)</li>
                <li>Photos, videos, or other media</li>
                <li>Location data</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Team Voice Chat</h3>
              <p className="text-sm text-slate-700">
                The Daily Crossword is designed for team collaboration. Voice chat lets
                teammates discuss clues and solve the puzzle together in real-time. It uses
                WebRTC technology where audio is transmitted peer-to-peer and is{" "}
                <strong>NOT recorded, stored, or accessible</strong> to OBOB.dog at any
                time. We encourage parental supervision when children use voice features.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Parental Rights</h3>
              <p className="leading-7 text-slate-700">
                Parents may contact us at{" "}
                <Link href="mailto:obobdotdog@gmail.com" className="underline">
                  obobdotdog@gmail.com
                </Link>{" "}
                to:
              </p>
              <ul className="ml-6 list-disc [&>li]:mt-2 text-slate-700">
                <li>Request information about data collected from their child</li>
                <li>Request deletion of any data associated with their child</li>
                <li>Ask questions about our privacy practices</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How We Use Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="ml-6 list-disc [&>li]:mt-2 text-slate-700">
              <li>To provide and improve our educational services</li>
              <li>To enable collaborative features like team crossword puzzles</li>
              <li>To respond to feedback and support requests</li>
              <li>To understand how our site is used and make it better</li>
              <li>To send newsletters (only if you signed up)</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Third-Party Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-7">
              We use the following third-party services to operate OBOB.dog:
            </p>
            <ul className="ml-6 list-disc [&>li]:mt-2 text-slate-700">
              <li>
                <strong>Vercel:</strong> Hosting and analytics
              </li>
              <li>
                <strong>PostHog:</strong> Product analytics (configured for privacy on
                children&apos;s features)
              </li>
              <li>
                <strong>Cloudflare:</strong> Content delivery and team data storage
              </li>
              <li>
                <strong>LiveKit:</strong> Voice chat infrastructure (audio is not stored)
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="ml-6 list-disc [&>li]:mt-2 text-slate-700">
              <li>
                <strong>Session identifiers:</strong> Expire after 24 hours
              </li>
              <li>
                <strong>Team data (crossword):</strong> Automatically deleted after 7 days
              </li>
              <li>
                <strong>Feedback submissions:</strong> Retained until reviewed, then deleted
                or anonymized
              </li>
              <li>
                <strong>Newsletter subscriptions:</strong> Until you unsubscribe
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-7">You have the right to:</p>
            <ul className="ml-6 list-disc [&>li]:mt-2 text-slate-700">
              <li>Request access to any personal information we hold about you</li>
              <li>Request correction or deletion of your information</li>
              <li>Opt out of analytics tracking by using browser privacy features</li>
              <li>Unsubscribe from newsletters at any time</li>
            </ul>
            <p className="leading-7 text-slate-700">
              To exercise these rights, contact us at{" "}
              <Link href="mailto:obobdotdog@gmail.com" className="underline">
                obobdotdog@gmail.com
              </Link>
              .
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Updates to This Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-7">
              We may update this Privacy Policy from time to time. We will notify users of
              any material changes by posting the new policy on this page with an updated
              effective date.
            </p>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-slate-500 py-4">
          <p>
            Questions about this policy? Email us at{" "}
            <Link href="mailto:obobdotdog@gmail.com" className="underline">
              obobdotdog@gmail.com
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
