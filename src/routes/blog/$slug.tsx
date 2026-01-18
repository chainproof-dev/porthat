import { createFileRoute, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowLeft, Share2, Tag } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BlogContent, TableOfContents } from "../../components/blog";
import { useTheme } from "../../context/ThemeContext";
import { ANIMATION } from "../../lib/constants";
import { getSectionGradient, getGlowColor } from "../../lib/themes";
import {
    createSEOConfigFromProfile,
    generateMetaTags,
} from "../../lib/seo";
import { generateArticleSchema, generateBreadcrumbSchema } from "../../lib/schema";
import { JsonLd } from "../../components/seo/JsonLd";
import blogsData from "../../data/blogs.json";
import portfolioData from "../../data/data.json";
import appCss from "../../styles.css?url";
import type { Profile, BlogPost } from "../../types/portfolio";

// =============================================================================
// STATIC PARAMS FOR SSG
// =============================================================================

export const Route = createFileRoute("/blog/$slug")({
    loader: ({ params }) => {
        const blogs = blogsData.blogs as BlogPost[];
        const blog = blogs.find((b) => b.slug === params.slug);
        if (!blog) {
            throw notFound();
        }
        return { blog };
    },
    head: ({ loaderData }) => {
        if (!loaderData) return {};
        const { blog } = loaderData;
        const { profile } = portfolioData;
        const seoConfig = createSEOConfigFromProfile(profile as Profile);

        return {
            meta: generateMetaTags(
                {
                    title: blog.title,
                    description: blog.metaDescription || blog.excerpt,
                    type: "article",
                    image: blog.coverImage ? `${seoConfig.siteUrl}${blog.coverImage}` : undefined,
                    canonical: `${seoConfig.siteUrl}/blog/${blog.slug}`,
                },
                seoConfig
            ),
            links: [
                { rel: "stylesheet", href: appCss },
                { rel: "canonical", href: `${seoConfig.siteUrl}/blog/${blog.slug}` },
            ],
        };
    },
    component: BlogPostPage,
    notFoundComponent: BlogNotFound,
});

// =============================================================================
// BLOG POST COMPONENT
// =============================================================================

function BlogPostContent() {
    const { blog } = Route.useLoaderData();
    const { colors, mode } = useTheme();
    const { profile } = portfolioData;
    const seoConfig = createSEOConfigFromProfile(profile as Profile);

    // Generate schemas
    const articleSchema = generateArticleSchema(blog, blog.author || profile.name);
    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: "Home", url: seoConfig.siteUrl },
        { name: "Blog", url: `${seoConfig.siteUrl}/blog` },
        { name: blog.title, url: `${seoConfig.siteUrl}/blog/${blog.slug}` },
    ]);

    // Get related posts (same tags)
    const allBlogs = blogsData.blogs as BlogPost[];
    const relatedPosts = allBlogs
        .filter((b) => b.slug !== blog.slug && b.tags.some((t) => blog.tags.includes(t)))
        .slice(0, 2);

    const handleShare = async () => {
        const url = `${window.location.origin}/blog/${blog.slug}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: blog.title,
                    text: blog.excerpt,
                    url,
                });
            } catch {
                // User cancelled or error
            }
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(url);
            // Could show a toast here
        }
    };

    return (
        <>
            {/* JSON-LD Schemas */}
            <JsonLd data={[articleSchema, breadcrumbSchema]} />

            {/* Article Header */}
            <motion.header variants={ANIMATION.fadeIn} className="mb-8">
                {/* Breadcrumbs */}
                <nav className="mb-4 text-sm" aria-label="Breadcrumb">
                    <ol className="flex items-center gap-2" style={{ color: `${colors.foreground}66` }}>
                        <li>
                            <Link to="/" className="hover:underline">Home</Link>
                        </li>
                        <li>/</li>
                        <li>
                            <Link to="/blog" className="hover:underline">Blog</Link>
                        </li>
                        <li>/</li>
                        <li style={{ color: colors.foreground }}>{blog.title.slice(0, 30)}...</li>
                    </ol>
                </nav>

                {/* Cover Image */}
                {blog.coverImage && (
                    <div className="relative h-48 sm:h-64 md:h-80 rounded-2xl overflow-hidden mb-6">
                        <img
                            src={blog.coverImage}
                            alt={blog.title}
                            className="w-full h-full object-cover"
                        />
                        <div
                            className="absolute inset-0"
                            style={{
                                background: `linear-gradient(to top, ${mode === "dark" ? "rgba(10,10,10,0.8)" : "rgba(250,250,250,0.6)"} 0%, transparent 50%)`,
                            }}
                        />
                    </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {blog.tags.map((tag) => (
                        <span
                            key={tag}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium"
                            style={{
                                backgroundColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                                color: colors.foreground,
                            }}
                        >
                            <Tag className="w-3 h-3" />
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Title */}
                <h1
                    className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-4"
                    style={{ color: colors.foreground }}
                >
                    {blog.title}
                </h1>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm" style={{ color: `${colors.foreground}80` }}>
                        <Calendar className="w-4 h-4" />
                        <time dateTime={blog.date}>{blog.date}</time>
                    </div>
                    {blog.readingTime && (
                        <div className="flex items-center gap-2 text-sm" style={{ color: `${colors.foreground}80` }}>
                            <Clock className="w-4 h-4" />
                            <span>{blog.readingTime}</span>
                        </div>
                    )}
                    {blog.author && (
                        <div className="text-sm" style={{ color: `${colors.foreground}80` }}>
                            By <span className="font-medium" style={{ color: colors.foreground }}>{blog.author}</span>
                        </div>
                    )}
                </div>

                {/* Share Button */}
                <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-colors cursor-pointer"
                    style={{
                        backgroundColor: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                        color: `${colors.foreground}99`,
                    }}
                >
                    <Share2 className="w-4 h-4" />
                    Share
                </button>
            </motion.header>

            {/* Article Content with TOC */}
            <div className="flex gap-8">
                {/* Main Content */}
                <motion.article
                    variants={ANIMATION.fadeIn}
                    className="flex-1 min-w-0 relative rounded-2xl p-6 sm:p-8 backdrop-blur-xl border mb-8"
                    style={{
                        background: getSectionGradient(colors, mode),
                        borderColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                    }}
                >
                    <div
                        className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none"
                        style={{ background: getGlowColor(colors, mode) }}
                    />
                    <div className="relative z-10">
                        {blog.content ? (
                            <BlogContent content={blog.content} />
                        ) : (
                            <p style={{ color: `${colors.foreground}99` }}>
                                {blog.excerpt}
                            </p>
                        )}
                    </div>
                </motion.article>

                {/* Table of Contents Sidebar */}
                {blog.content && <TableOfContents content={blog.content} />}
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <motion.section variants={ANIMATION.fadeIn}>
                    <h2
                        className="text-lg font-semibold mb-4 flex items-center gap-2"
                        style={{ color: colors.foreground }}
                    >
                        <div
                            className="h-5 w-1 rounded-full"
                            style={{ background: `linear-gradient(to bottom, ${colors.secondary}, ${colors.primary})` }}
                        />
                        Related Posts
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {relatedPosts.map((post) => (
                            <Link
                                key={post.slug}
                                to="/blog/$slug"
                                params={{ slug: post.slug }}
                                className="group block"
                            >
                                <motion.div
                                    whileHover={{ x: 4 }}
                                    className="p-4 rounded-xl border backdrop-blur-xl transition-all"
                                    style={{
                                        backgroundColor: mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.5)",
                                        borderColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                                    }}
                                >
                                    <h3
                                        className="font-medium mb-2 line-clamp-2 group-hover:underline"
                                        style={{ color: colors.foreground }}
                                    >
                                        {post.title}
                                    </h3>
                                    <p
                                        className="text-sm line-clamp-2"
                                        style={{ color: `${colors.foreground}80` }}
                                    >
                                        {post.excerpt}
                                    </p>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </motion.section>
            )}

            {/* Back to Blog */}
            <motion.div variants={ANIMATION.fadeIn} className="mt-8 pt-6 border-t" style={{ borderColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
                <Link
                    to="/blog"
                    className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                    style={{ color: colors.primary }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to all posts
                </Link>
            </motion.div>
        </>
    );
}

function BlogPostPage() {
    return <BlogPostContent />;
}

// =============================================================================
// NOT FOUND COMPONENT
// =============================================================================

function BlogNotFound() {
    return <NotFoundContent />;
}

function NotFoundContent() {
    const { colors, mode } = useTheme();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 rounded-2xl border backdrop-blur-xl"
            style={{
                backgroundColor: mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.6)",
                borderColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
            }}
        >
            <h1 className="text-4xl font-bold mb-4" style={{ color: colors.foreground }}>
                404
            </h1>
            <p className="text-lg mb-2" style={{ color: colors.foreground }}>
                Post not found
            </p>
            <p className="text-sm mb-6" style={{ color: `${colors.foreground}66` }}>
                The blog post you're looking for doesn't exist.
            </p>
            <Link
                to="/blog"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{
                    backgroundColor: colors.primary,
                    color: "#fff",
                }}
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
            </Link>
        </motion.div>
    );
}
