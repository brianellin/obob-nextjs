import Link from 'next/link';
import { getAllBlogPostsMeta } from '@/lib/blog';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | OBOB.dog',
  description: 'News, updates, and tips for Oregon Battle of the Books practice',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BlogPage() {
  const posts = getAllBlogPostsMeta();

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8 font-playfair">Blog</h1>

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
                <h2 className="text-2xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h2>
                <time className="text-sm text-gray-500 block mb-2">
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
          className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.18 15.64a2.18 2.18 0 1 1 0 4.36 2.18 2.18 0 0 1 0-4.36m0-2.5a4.68 4.68 0 1 0 0 9.36 4.68 4.68 0 0 0 0-9.36M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1" />
          </svg>
          RSS Feed
        </Link>
      </div>
    </div>
  );
}
