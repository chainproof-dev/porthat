import blogsData from "../data/blogs.json";
import portfolioData from "../data/data.json";
import type { BlogPost } from "../types/portfolio";

const SITE_URL = import.meta.env.VITE_SITE_URL || "https://umar.ac";

/**
 * Generates RSS 2.0 feed XML for blog posts
 */
export function generateRSSFeed(): string {
    const { profile } = portfolioData;
    const blogs = blogsData.blogs as BlogPost[];

    const feedItems = blogs
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((blog) => {
            const pubDate = new Date(blog.date).toUTCString();
            const link = `${SITE_URL}/blog/${blog.slug}`;

            return `
    <item>
      <title><![CDATA[${blog.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${blog.excerpt}]]></description>
      <pubDate>${pubDate}</pubDate>
      ${blog.tags.map((tag) => `<category>${tag}</category>`).join("\n      ")}
      ${blog.author ? `<author>${profile.email} (${blog.author})</author>` : ""}
    </item>`;
        })
        .join("\n");

    const lastBuildDate = new Date().toUTCString();

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${profile.name}'s Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Technical articles and insights by ${profile.name} on security research, kernel development, and systems programming.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/favicon.ico</url>
      <title>${profile.name}'s Blog</title>
      <link>${SITE_URL}/blog</link>
    </image>
${feedItems}
  </channel>
</rss>`;
}

/**
 * Generates Atom feed XML for blog posts
 */
export function generateAtomFeed(): string {
    const { profile } = portfolioData;
    const blogs = blogsData.blogs as BlogPost[];

    const entries = blogs
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((blog) => {
            const updated = new Date(blog.date).toISOString();
            const link = `${SITE_URL}/blog/${blog.slug}`;

            return `
  <entry>
    <title><![CDATA[${blog.title}]]></title>
    <link href="${link}" rel="alternate" type="text/html"/>
    <id>${link}</id>
    <updated>${updated}</updated>
    <summary><![CDATA[${blog.excerpt}]]></summary>
    <author>
      <name>${blog.author || profile.name}</name>
    </author>
    ${blog.tags.map((tag) => `<category term="${tag}"/>`).join("\n    ")}
  </entry>`;
        })
        .join("\n");

    const updated = new Date().toISOString();

    return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${profile.name}'s Blog</title>
  <subtitle>Technical articles and insights</subtitle>
  <link href="${SITE_URL}/blog" rel="alternate" type="text/html"/>
  <link href="${SITE_URL}/atom.xml" rel="self" type="application/atom+xml"/>
  <id>${SITE_URL}/blog</id>
  <updated>${updated}</updated>
  <author>
    <name>${profile.name}</name>
    <email>${profile.email}</email>
  </author>
${entries}
</feed>`;
}
