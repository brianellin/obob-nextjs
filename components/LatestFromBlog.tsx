import Link from 'next/link';
import { getAllBlogPostsMeta } from '@/lib/blog';

interface LatestFromBlogProps {
  count?: number;
}

export default function LatestFromBlog({ count = 1 }: LatestFromBlogProps) {
  const allPosts = getAllBlogPostsMeta();
  const posts = allPosts.slice(0, count);

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="max-w-2xl mx-auto mb-8">
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Latest from the blog
        </p>
        <div className="space-y-4">
          {posts.map((post, index) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className={`group block ${index < posts.length - 1 ? 'pb-4 border-b border-gray-100' : ''}`}
            >
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-cyan-500 transition-colors font-heading">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-gray-600 mt-1 text-sm">{post.excerpt}</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
