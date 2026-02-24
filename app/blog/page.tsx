import Link from 'next/link';
import { getAllBlogPostsMeta } from '@/lib/blog';
import type { Metadata } from 'next';

const SITE_URL = 'https://obob.dog';
const SITE_NAME = 'OBOB.dog';

export const metadata: Metadata = {
  title: 'OBOB.DOG Blog | Oregon Battle of the Books News & Updates',
  description: 'News, updates, tips, and feature announcements for OBOB.dog - the free practice tool for Oregon Battle of the Books. Help your team prepare for OBOB competitions.',
  keywords: ['OBOB', 'Oregon Battle of the Books', 'OBOB practice', 'reading competition', 'book quiz', 'OBOB questions'],
  authors: [{ name: 'OBOB.dog Team' }],
  alternates: {
    canonical: `${SITE_URL}/blog`,
    types: {
      'application/rss+xml': `${SITE_URL}/feed.xml`,
    },
  },
  openGraph: {
    title: 'OBOB.DOG Blog',
    description: 'News, updates, and tips for Oregon Battle of the Books practice',
    type: 'website',
    url: `${SITE_URL}/blog`,
    siteName: SITE_NAME,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'OBOB.DOG Blog',
    description: 'News, updates, and tips for Oregon Battle of the Books practice',
  },
  robots: {
    index: true,
    follow: true,
  },
};

function formatDate(dateString: string): string {
  // Parse as noon UTC to avoid date shift, then display in Pacific Time
  const date = new Date(`${dateString}T12:00:00Z`);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Los_Angeles',
  });
}

// JSON-LD structured data for the blog listing
function generateBlogListingJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'OBOB.dog Blog',
    description: 'News, updates, and tips for Oregon Battle of the Books practice',
    url: `${SITE_URL}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'OBOB.dog',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/rosie-icon.png`,
      },
    },
  };
}

export default function BlogPage() {
  const posts = getAllBlogPostsMeta();
  const jsonLd = generateBlogListingJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold mb-8 font-rampart">OBOB.DOG Blog</h1>

        {posts.length === 0 ? (
          <p className="text-gray-600">No blog posts yet. Check back soon!</p>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <article key={post.slug} className="border-b border-gray-200 pb-8 last:border-b-0">
                <Link href={`/blog/${post.slug}`} className="group">
                  {post.coverImage && (
                    <div className="mb-4 overflow-hidden rounded-lg">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}
                  <h2 className="text-2xl font-bold mb-2 group-hover:text-cyan-500 transition-colors font-heading">
                    {post.title}
                  </h2>
                  <time className="text-sm text-gray-500 block mb-2" dateTime={new Date(post.date).toISOString()}>
                    {formatDate(post.date)}
                  </time>
                  {post.excerpt && (
                    <p className="text-gray-600">{post.excerpt}</p>
                  )}
                </Link>
              </article>
            ))}
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-gray-200">
          <Link
            href="/feed.xml"
            className="text-sm text-gray-500 hover:text-cyan-500 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6.18 15.64a2.18 2.18 0 1 1 0 4.36 2.18 2.18 0 0 1 0-4.36m0-2.5a4.68 4.68 0 1 0 0 9.36 4.68 4.68 0 0 0 0-9.36M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1" />
            </svg>
            RSS Feed
          </Link>
        </div>
      </div>
    </>
  );
}
