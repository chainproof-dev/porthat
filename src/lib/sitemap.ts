/**
 * Sitemap Generation Utilities
 * Generates XML sitemaps for SEO
 */

import type { BlogPost } from "@/types/portfolio";

// =============================================================================
// TYPES
// =============================================================================

interface SitemapUrl {
    /** URL of the page */
    loc: string;
    /** Last modification date (ISO 8601) */
    lastmod?: string;
    /** Change frequency */
    changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
    /** Priority (0.0 to 1.0) */
    priority?: number;
}

// =============================================================================
// GENERATORS
// =============================================================================

/**
 * Generate sitemap URLs from blog posts
 */
export function generateBlogSitemapUrls(
    blogs: BlogPost[],
    baseUrl: string
): SitemapUrl[] {
    return blogs.map((blog) => ({
        loc: `${baseUrl}/blog/${blog.slug}`,
        lastmod: blog.date,
        changefreq: "monthly" as const,
        priority: 0.7,
    }));
}

/**
 * Generate static page sitemap URLs
 */
export function generateStaticSitemapUrls(baseUrl: string): SitemapUrl[] {
    return [
        {
            loc: baseUrl,
            changefreq: "weekly",
            priority: 1.0,
        },
        {
            loc: `${baseUrl}/blog`,
            changefreq: "daily",
            priority: 0.9,
        },
    ];
}

/**
 * Generate complete sitemap XML string
 */
export function generateSitemapXml(urls: SitemapUrl[]): string {
    const urlElements = urls
        .map((url) => {
            const elements = [`    <loc>${escapeXml(url.loc)}</loc>`];

            if (url.lastmod) {
                elements.push(`    <lastmod>${url.lastmod}</lastmod>`);
            }
            if (url.changefreq) {
                elements.push(`    <changefreq>${url.changefreq}</changefreq>`);
            }
            if (url.priority !== undefined) {
                elements.push(`    <priority>${url.priority.toFixed(1)}</priority>`);
            }

            return `  <url>\n${elements.join("\n")}\n  </url>`;
        })
        .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

/**
 * Generate complete sitemap from all sources
 */
export function generateFullSitemap(blogs: BlogPost[], baseUrl: string): string {
    const staticUrls = generateStaticSitemapUrls(baseUrl);
    const blogUrls = generateBlogSitemapUrls(blogs, baseUrl);
    const allUrls = [...staticUrls, ...blogUrls];

    return generateSitemapXml(allUrls);
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Escape special XML characters
 */
function escapeXml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}
