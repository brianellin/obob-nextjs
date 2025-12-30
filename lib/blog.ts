import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  coverImage?: string;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage?: string;
}

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

export function getBlogSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) {
    return [];
  }
  return fs.readdirSync(BLOG_DIR)
    .filter(file => file.endsWith('.md') && file !== 'README.md')
    .map(file => file.replace(/\.md$/, ''));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(content);

  return {
    slug,
    title: data.title || 'Untitled',
    date: data.date || new Date().toISOString(),
    excerpt: data.excerpt || '',
    content: processedContent.toString(),
    coverImage: data.coverImage,
  };
}

export function getAllBlogPostsMeta(): BlogPostMeta[] {
  const slugs = getBlogSlugs();

  const posts = slugs.map(slug => {
    const filePath = path.join(BLOG_DIR, `${slug}.md`);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);

    return {
      slug,
      title: data.title || 'Untitled',
      date: data.date || new Date().toISOString(),
      excerpt: data.excerpt || '',
      coverImage: data.coverImage,
    };
  });

  // Sort by date, newest first
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const slugs = getBlogSlugs();
  const posts = await Promise.all(slugs.map(slug => getBlogPostBySlug(slug)));

  return posts
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export interface AdjacentPosts {
  prev: BlogPostMeta | null;
  next: BlogPostMeta | null;
}

export function getAdjacentPosts(currentSlug: string): AdjacentPosts {
  const allPosts = getAllBlogPostsMeta(); // Already sorted newest first
  const currentIndex = allPosts.findIndex(post => post.slug === currentSlug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  // prev = older post (higher index), next = newer post (lower index)
  const prev = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const next = currentIndex > 0 ? allPosts[currentIndex - 1] : null;

  return { prev, next };
}
