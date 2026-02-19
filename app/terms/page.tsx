import Link from "next/link";
import { FileText } from "lucide-react";
import { WavyUnderline } from "@/components/WavyUnderline";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Terms of Service | OBOB.dog",
  description: "Terms of Service for OBOB.dog - Oregon Battle of the Books practice tool",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-4">
      <h1 className="text-4xl font-bold text-center mb-8 font-rampart">
        <WavyUnderline style={0} thickness={4} color="text-yellow-900">
          Terms of Service
        </WavyUnderline>
      </h1>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Agreement to Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-7">
              By accessing or using OBOB.dog, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our service.
            </p>
            <p className="leading-7 text-sm text-slate-600">
              <strong>Effective Date:</strong> February 2026
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Description of Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-7">
              OBOB.dog is a <strong>free educational tool</strong> designed to help students
              practice for the Oregon Battle of the Books (OBOB) competition. Our services
              include:
            </p>
            <ul className="ml-6 list-disc [&>li]:mt-2 text-slate-700">
              <li>Practice quiz battles with OBOB-style questions</li>
              <li>Daily collaborative crossword puzzles</li>
              <li>Question browsing and community contributions</li>
              <li>Optional voice chat for team collaboration</li>
            </ul>
            <p className="leading-7 text-slate-700">
              This service is provided at no cost and is intended for educational purposes only.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Book Content</h3>
              <p className="leading-7 text-slate-700">
                All book titles, author names, cover images, and related content are the
                property of their respective owners. Our questions reference these works for
                educational purposes under fair use principles.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Question Content</h3>
              <p className="leading-7 text-slate-700">
                Practice questions come from various sources including schools, libraries, and
                parent volunteers who have made them publicly available. Each question cites
                its source. All questions are licensed under the{" "}
                <Link
                  href="https://creativecommons.org/licenses/by-nc/4.0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)
                </Link>{" "}
                license.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Our Code</h3>
              <p className="leading-7 text-slate-700">
                The OBOB.dog website code is open source and available on{" "}
                <Link
                  href="https://github.com/brianellin/obob-nextjs"
                  className="underline"
                >
                  GitHub
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Downloads & Licensing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="https://licensebuttons.net/l/by-nc/4.0/88x31.png"
                alt="CC BY-NC 4.0"
                width={88}
                height={31}
              />
              <p className="leading-7 text-slate-700">
                Downloadable question sets are licensed under{" "}
                <Link
                  href="https://creativecommons.org/licenses/by-nc/4.0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  CC BY-NC 4.0
                </Link>
                .
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">License Requirements</h3>
              <ul className="ml-6 list-disc [&>li]:mt-2 text-slate-700">
                <li>
                  <strong>Non-commercial use only.</strong> You may not use downloaded
                  questions for any commercial purpose.
                </li>
                <li>
                  <strong>Attribution required.</strong> When using questions in derivative
                  works (apps, games, tools, flashcards, etc.), you must credit obob.dog
                  and the original question source.
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Example Attribution</h3>
              <p className="leading-7 text-slate-600 italic bg-slate-50 p-3 rounded-md text-sm">
                &ldquo;Questions from obob.dog, originally contributed by [Source Name].
                Licensed under CC BY-NC 4.0.&rdquo;
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Conduct</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-7">When using OBOB.dog, you agree to:</p>
            <ul className="ml-6 list-disc [&>li]:mt-2 text-slate-700">
              <li>Use the service for its intended educational purpose</li>
              <li>Treat other users with respect, especially in voice chat</li>
              <li>Not attempt to disrupt or interfere with the service</li>
              <li>Not submit false, misleading, or inappropriate content</li>
              <li>Not use the service to collect information about other users</li>
            </ul>
            <p className="leading-7 text-slate-700">
              We reserve the right to remove any content or restrict access to users who
              violate these guidelines.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Disclaimer of Warranties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-7">
              OBOB.dog is provided <strong>&ldquo;AS IS&rdquo;</strong> and{" "}
              <strong>&ldquo;AS AVAILABLE&rdquo;</strong> without warranties of any kind,
              either express or implied.
            </p>
            <p className="leading-7 text-slate-700">We do not warrant that:</p>
            <ul className="ml-6 list-disc [&>li]:mt-2 text-slate-700">
              <li>The service will be uninterrupted or error-free</li>
              <li>All questions are accurate, complete, or up-to-date</li>
              <li>The service will meet your specific requirements</li>
              <li>Any errors or defects will be corrected</li>
            </ul>
            <p className="leading-7 text-slate-700 italic">
              Questions are created by community volunteers and may contain errors. Always
              verify answers with your official OBOB materials.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-7">
              To the fullest extent permitted by law, <strong>Doing Systems, LLC</strong> and
              its operators shall not be liable for any:
            </p>
            <ul className="ml-6 list-disc [&>li]:mt-2 text-slate-700">
              <li>Indirect, incidental, special, or consequential damages</li>
              <li>Loss of profits, data, or other intangible losses</li>
              <li>Damages resulting from your use or inability to use the service</li>
              <li>Damages resulting from incorrect or outdated question content</li>
              <li>Damages resulting from any third-party content or conduct</li>
            </ul>
            <p className="leading-7 text-slate-700">
              As this is a free educational service provided at no cost, the maximum liability
              of Doing Systems, LLC for any claim shall not exceed $0.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Indemnification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-7">
              You agree to indemnify and hold harmless Doing Systems, LLC and its operators
              from any claims, damages, or expenses arising from your use of the service or
              violation of these terms.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-7">
              We may modify these Terms of Service at any time. We will notify users of any
              material changes by posting the updated terms on this page. Your continued use
              of the service after changes are posted constitutes acceptance of the new terms.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Governing Law</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-7">
              These Terms of Service shall be governed by and construed in accordance with
              the laws of the <strong>State of Oregon</strong>, without regard to its conflict
              of law provisions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="leading-7">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <p className="text-slate-700">
              <strong>Doing Systems, LLC</strong>
              <br />
              Email:{" "}
              <Link href="mailto:obobdotdog@gmail.com" className="underline">
                obobdotdog@gmail.com
              </Link>
              <br />
              Website:{" "}
              <Link href="https://doing.systems" className="underline">
                doing.systems
              </Link>
            </p>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-slate-500 py-4">
          <p>
            See also our{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
