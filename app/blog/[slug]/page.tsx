import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBlogPostBySlug, getBlogSlugs, getAdjacentPosts } from '@/lib/blog';
import type { Metadata } from 'next';

const SITE_URL = 'https://obob.dog';
const SITE_NAME = 'OBOB.dog';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-blog.png`;

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = getBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found | OBOB.dog',
    };
  }

  const postUrl = `${SITE_URL}/blog/${slug}`;
  const ogImage = post.coverImage || DEFAULT_OG_IMAGE;

  return {
    title: `${post.title} | OBOB.dog Blog`,
    description: post.excerpt,
    authors: [{ name: 'OBOB.dog Team' }],
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url: postUrl,
      siteName: SITE_NAME,
      locale: 'en_US',
      publishedTime: new Date(post.date).toISOString(),
      authors: ['OBOB.dog Team'],
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// JSON-LD structured data for blog posts
function generateArticleJsonLd(post: { title: string; date: string; excerpt: string; content: string }, slug: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.date).toISOString(),
    author: {
      '@type': 'Organization',
      name: 'OBOB.dog',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'OBOB.dog',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/rosie-icon.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${slug}`,
    },
    url: `${SITE_URL}/blog/${slug}`,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const jsonLd = generateArticleJsonLd(post, slug);
  const { prev, next } = getAdjacentPosts(slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="max-w-3xl mx-auto py-8 px-4">
        <Link
          href="/blog"
          className="text-4xl font-bold mb-8 font-rampart hover:text-cyan-500 transition-colors inline-block"
        >
          OBOB.DOG Blog
        </Link>

        {post.coverImage && (
          <div className="mb-6 overflow-hidden rounded-lg">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4 font-heading">{post.title}</h1>
          <time className="text-gray-500" dateTime={new Date(post.date).toISOString()}>
            {formatDate(post.date)}
          </time>
        </header>

        <div
          className="prose prose-lg max-w-none prose-headings:font-heading prose-a:text-cyan-500 prose-img:rounded-lg prose-p:leading-relaxed prose-li:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Newsletter CTA */}
        <div className="mt-12 p-6 bg-gray-100 rounded-lg text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2 font-heading">
            Want more OBOB.dog updates?
          </h3>
          <p className="text-gray-600 mb-4">
            Get occasional updates about new features, practice questions, and OBOB tips.
          </p>
          <Link
            href="/newsletter"
            className="inline-flex items-center px-4 py-2 bg-cyan-500 text-white font-medium rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Subscribe to the Newsletter
          </Link>
        </div>

        {/* Previous/Next Post Navigation */}
        {(prev || next) && (
          <nav className="mt-12 pt-8 border-t border-gray-200" aria-label="Blog post navigation">
            <div className="flex flex-col sm:flex-row justify-between gap-6">
              {prev ? (
                <Link
                  href={`/blog/${prev.slug}`}
                  className="group flex-1 p-4 rounded-lg border border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 transition-colors"
                >
                  <span className="text-sm text-gray-500 block mb-1">&larr; Previous</span>
                  <span className="font-semibold text-gray-900 group-hover:text-cyan-500 transition-colors">
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <div className="flex-1" />
              )}
              {next ? (
                <Link
                  href={`/blog/${next.slug}`}
                  className="group flex-1 p-4 rounded-lg border border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 transition-colors text-right"
                >
                  <span className="text-sm text-gray-500 block mb-1">Next &rarr;</span>
                  <span className="font-semibold text-gray-900 group-hover:text-cyan-500 transition-colors">
                    {next.title}
                  </span>
                </Link>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          </nav>
        )}
      </article>
    </>
  );
}
