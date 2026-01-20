import Link from "next/link";
import HomeHero from "@/components/HomeHero";
import LatestFromBlog from "@/components/LatestFromBlog";

export default function Home() {
  return (
    <main className="bg-white p-2">
      <HomeHero />

      {/* Separator */}
      <div className="max-w-2xl mx-auto my-12">
        <div className="border-t border-gray-200" />
      </div>

      {/* Latest from blog */}
      <LatestFromBlog count={3} />

      {/* Contribution callout */}
      <section className="max-w-2xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <span className="text-3xl">📚</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2 font-heading">
                Help improve <span className="font-rampart">OBOB.dog</span>!
              </h3>
              <p className="text-gray-700 mb-3">
                Interested in contributing new questions to OBOB.dog? You can
                help make it better for everyone.
              </p>
              <Link
                href="/blog/obob-dog-community"
                className="inline-flex items-center text-gray-900 font-semibold hover:text-gray-700 transition-colors"
              >
                Read our contribution guide →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
