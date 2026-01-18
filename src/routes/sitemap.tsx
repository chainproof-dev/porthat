import { createFileRoute } from "@tanstack/react-router";
import { generateFullSitemap } from "../lib/sitemap";
import { getSEOConfig } from "../lib/seo";
import blogsData from "../data/blogs.json";
import type { BlogPost } from "../types/portfolio";

// =============================================================================
// ROUTE DEFINITION
// =============================================================================

export const Route = createFileRoute("/sitemap")({
    loader: () => {
        const seoConfig = getSEOConfig();
        const blogs = blogsData.blogs as BlogPost[];
        const sitemap = generateFullSitemap(blogs, seoConfig.siteUrl);
        return { sitemap };
    },
    component: SitemapPage,
});

// =============================================================================
// SITEMAP PAGE COMPONENT
// =============================================================================

function SitemapPage() {
    const { sitemap } = Route.useLoaderData();

    // Display the sitemap XML
    // In production, this would ideally be served with Content-Type: application/xml
    // For static site generation, the XML content is rendered as text
    return (
        <pre
            style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "monospace",
                fontSize: "12px",
                padding: "20px",
                backgroundColor: "#0a0a0a",
                color: "#a3e635",
                margin: 0,
                minHeight: "100vh",
            }}
        >
            {sitemap}
        </pre>
    );
}
