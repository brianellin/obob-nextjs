# Writing Blog Posts

Blog posts are markdown files stored in this directory (`content/blog/`).

## Creating a New Post

1. Create a new `.md` file in this directory
2. Name it with a URL-friendly slug (e.g., `my-new-post.md`)
3. Add frontmatter at the top of the file
4. Write your content in markdown below the frontmatter

## Frontmatter

Every post must start with YAML frontmatter between `---` markers:

```yaml
---
title: "Your Post Title"
date: "2024-12-29"
excerpt: "A brief description shown on the blog listing page"
coverImage: "/blog/your-cover-image.jpg"
---
```

### Required Fields

- **title**: The post title (displayed on the page and in the browser tab)
- **date**: Publication date in `YYYY-MM-DD` format (used for sorting)
- **excerpt**: A short summary shown on the blog listing page

### Optional Fields

- **coverImage**: Path to a cover image (displayed at the top of the post and on the listing)

## Adding Images

### Where to Put Images

Place images in `public/blog/`. They will be accessible at `/blog/filename.ext`.

```
public/
  blog/
    my-image.png
    post-cover.jpg
```

### Using Images in Posts

Reference images in your markdown:

```markdown
![Alt text description](/blog/my-image.png)
```

For a cover image, use the `coverImage` frontmatter field:

```yaml
---
title: "My Post"
date: "2024-12-29"
excerpt: "Post description"
coverImage: "/blog/post-cover.jpg"
---
```

### Image Best Practices

- Use descriptive filenames (e.g., `author-pronunciation-demo.png` not `image1.png`)
- Optimize images for web (compress PNGs/JPGs, consider WebP)
- Recommended cover image size: 1200x630px (social sharing friendly)
- Add meaningful alt text for accessibility

## Markdown Features

Standard markdown is supported:

```markdown
# Heading 1
## Heading 2
### Heading 3

**bold** and *italic*

- Bullet lists
- Like this

1. Numbered lists
2. Like this

[Link text](https://example.com)

> Blockquotes

`inline code`

​```javascript
// Code blocks with syntax highlighting
const x = 1;
​```
```

HTML is also supported for advanced formatting.

## Example Post

```markdown
---
title: "New Feature: Practice Mode"
date: "2024-12-29"
excerpt: "We've added a new practice mode to help you prepare for OBOB battles!"
coverImage: "/blog/practice-mode-screenshot.png"
---

We're excited to announce a new practice mode!

## What's New

Practice mode lets you:

- Focus on specific books
- Review questions at your own pace
- Track your progress

![Practice mode interface](/blog/practice-mode-ui.png)

Try it out and let us know what you think!
```

## After Writing

1. Save your `.md` file in this directory
2. Images go in `public/blog/`
3. The post will appear automatically after the next build
4. RSS feed at `/feed.xml` updates automatically
