import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, TrendingUp, Clock, Calendar } from "lucide-react";
import { BlogCard, BlogSearch } from "../../components/blog";
import { useTheme } from "../../context/ThemeContext";
import { ANIMATION } from "../../lib/constants";
import { getSectionGradient, getGlowColor } from "../../lib/themes";
import {
    createSEOConfigFromProfile,
    generateMetaTags,
} from "../../lib/seo";
import { generateBreadcrumbSchema, generateWebSiteSchema } from "../../lib/schema";
import { JsonLd } from "../../components/seo/JsonLd";
import blogsData from "../../data/blogs.json";
import portfolioData from "../../data/data.json";
import appCss from "../../styles.css?url";
import type { Profile, BlogPost, BlogConfig } from "../../types/portfolio";

// =============================================================================
// BLOG CONFIG
// =============================================================================

// Extract blog configuration with sensible defaults for static builds
const blogConfig: BlogConfig = portfolioData.blogConfig ?? {
    title: "Blog",
    subtitle: "Thoughts & Technical Writing",
    description: "Technical articles and insights.",
};

// =============================================================================
// UTILITIES
// =============================================================================

function calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
}

// =============================================================================
// SEO CONFIGURATION
// =============================================================================

const { profile } = portfolioData;
const seoConfig = createSEOConfigFromProfile(profile as Profile);
const blogs = blogsData.blogs as BlogPost[];

// Calculate stats
const totalPosts = blogs.length;
const totalReadingTime = blogs.reduce((acc, blog) => {
    const time = blog.content ? calculateReadingTime(blog.content) : parseInt(blog.readingTime || "5");
    return acc + time;
}, 0);

// Get all unique tags
const allTags = [...new Set(blogs.flatMap((blog) => blog.tags))];

// Generate blog listing schema
const blogListSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${profile.name}'s Blog`,
    description: `Technical articles and insights by ${profile.name}`,
    url: `${seoConfig.siteUrl}/blog`,
    author: {
        "@type": "Person",
        name: profile.name,
    },
    blogPost: blogs.map((blog) => ({
        "@type": "BlogPosting",
        headline: blog.title,
        description: blog.excerpt,
        datePublished: blog.date,
        author: {
            "@type": "Person",
            name: blog.author || profile.name,
        },
        url: `${seoConfig.siteUrl}/blog/${blog.slug}`,
    })),
};

const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: seoConfig.siteUrl },
    { name: "Blog", url: `${seoConfig.siteUrl}/blog` },
]);

const websiteSchema = generateWebSiteSchema(seoConfig, profile as Profile);

// =============================================================================
// ROUTE DEFINITION
// =============================================================================

export const Route = createFileRoute("/blog/")({
    head: () => ({
        meta: generateMetaTags(
            {
                title: `Blog | ${profile.name}`,
                description: `Technical articles, tutorials, and insights on security research, kernel development, and systems programming by ${profile.name}.`,
                type: "website",
                canonical: `${seoConfig.siteUrl}/blog`,
            },
            seoConfig
        ),
        links: [
            { rel: "stylesheet", href: appCss },
            { rel: "canonical", href: `${seoConfig.siteUrl}/blog` },
        ],
    }),
    component: BlogListingPage,
});

// =============================================================================
// BLOG LISTING COMPONENT
// =============================================================================

function BlogListingPage() {
    const { colors, mode } = useTheme();
    const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>(blogs);

    // Memoized filtered results
    const displayedBlogs = useMemo(() => {
        const featured = filteredBlogs.slice(0, 2);
        const remaining = filteredBlogs.slice(2);
        return { featured, remaining };
    }, [filteredBlogs]);

    const isFiltered = filteredBlogs.length !== blogs.length;

    return (
        <>
            {/* JSON-LD Schemas */}
            <JsonLd data={[blogListSchema, breadcrumbSchema, websiteSchema]} />

            {/* Page Header with Stats */}
            <motion.section
                variants={ANIMATION.fadeIn}
                initial="hidden"
                animate="visible"
                className="mb-8 sm:mb-10 relative overflow-hidden rounded-2xl p-6 sm:p-8 backdrop-blur-xl border"
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
                    <div className="flex items-center gap-3 mb-4">
                        <div
                            className="p-2.5 rounded-xl"
                            style={{
                                background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}20)`,
                            }}
                        >
                            <BookOpen className="w-5 h-5" style={{ color: colors.primary }} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.foreground }}>
                                {blogConfig.title}
                            </h1>
                            <p className="text-sm" style={{ color: `${colors.foreground}80` }}>
                                {blogConfig.subtitle}
                            </p>
                        </div>
                    </div>
                    <p
                        className="text-sm sm:text-base leading-relaxed max-w-2xl mb-6"
                        style={{ color: `${colors.foreground}99` }}
                    >
                        {blogConfig.description}
                    </p>

                    {/* Blog Stats */}
                    <div className="flex flex-wrap gap-4 sm:gap-6">
                        <div className="flex items-center gap-2">
                            <div
                                className="p-1.5 rounded-lg"
                                style={{ backgroundColor: `${colors.primary}15` }}
                            >
                                <TrendingUp className="w-4 h-4" style={{ color: colors.primary }} />
                            </div>
                            <div>
                                <p className="text-lg font-bold" style={{ color: colors.foreground }}>
                                    {totalPosts}
                                </p>
                                <p className="text-xs" style={{ color: `${colors.foreground}66` }}>
                                    Articles
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                className="p-1.5 rounded-lg"
                                style={{ backgroundColor: `${colors.secondary}15` }}
                            >
                                <Clock className="w-4 h-4" style={{ color: colors.secondary }} />
                            </div>
                            <div>
                                <p className="text-lg font-bold" style={{ color: colors.foreground }}>
                                    {totalReadingTime}
                                </p>
                                <p className="text-xs" style={{ color: `${colors.foreground}66` }}>
                                    Min Total Read
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                className="p-1.5 rounded-lg"
                                style={{ backgroundColor: `${colors.primary}15` }}
                            >
                                <Calendar className="w-4 h-4" style={{ color: colors.primary }} />
                            </div>
                            <div>
                                <p className="text-lg font-bold" style={{ color: colors.foreground }}>
                                    {allTags.length}
                                </p>
                                <p className="text-xs" style={{ color: `${colors.foreground}66` }}>
                                    Topics
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Search and Filter */}
            <motion.section
                variants={ANIMATION.fadeIn}
                initial="hidden"
                animate="visible"
            >
                <BlogSearch
                    blogs={blogs}
                    onFilter={setFilteredBlogs}
                    allTags={allTags}
                />
            </motion.section>

            {/* Featured Posts (only when not filtering) */}
            {!isFiltered && displayedBlogs.featured.length > 0 && (
                <motion.section
                    className="mb-8"
                    variants={ANIMATION.fadeIn}
                    initial="hidden"
                    animate="visible"
                >
                    <h2
                        className="text-lg font-semibold mb-4 flex items-center gap-2"
                        style={{ color: colors.foreground }}
                    >
                        <div
                            className="h-5 w-1 rounded-full"
                            style={{ background: `linear-gradient(to bottom, ${colors.secondary}, ${colors.primary})` }}
                        />
                        Featured Posts
                    </h2>
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
                        variants={ANIMATION.cardStagger}
                        initial="hidden"
                        animate="visible"
                    >
                        {displayedBlogs.featured.map((blog, index) => (
                            <BlogCard key={blog.slug} blog={blog} index={index} featured />
                        ))}
                    </motion.div>
                </motion.section>
            )}

            {/* All Posts / Search Results */}
            {(isFiltered ? filteredBlogs : displayedBlogs.remaining).length > 0 && (
                <motion.section
                    variants={ANIMATION.fadeIn}
                    initial="hidden"
                    animate="visible"
                >
                    <h2
                        className="text-lg font-semibold mb-4 flex items-center gap-2"
                        style={{ color: colors.foreground }}
                    >
                        <div
                            className="h-5 w-1 rounded-full"
                            style={{ background: `linear-gradient(to bottom, ${colors.secondary}, ${colors.primary})` }}
                        />
                        {isFiltered ? "Search Results" : "All Posts"}
                    </h2>
                    <motion.div
                        className="space-y-3"
                        variants={ANIMATION.cardStagger}
                        initial="hidden"
                        animate="visible"
                    >
                        {(isFiltered ? filteredBlogs : displayedBlogs.remaining).map((blog, index) => (
                            <BlogCard key={blog.slug} blog={blog} index={index} />
                        ))}
                    </motion.div>
                </motion.section>
            )}

            {/* Empty State */}
            {filteredBlogs.length === 0 && (
                <motion.div
                    variants={ANIMATION.fadeIn}
                    initial="hidden"
                    animate="visible"
                    className="text-center py-16 rounded-2xl border backdrop-blur-xl"
                    style={{
                        backgroundColor: mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.6)",
                        borderColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                    }}
                >
                    <BookOpen
                        className="w-12 h-12 mx-auto mb-4"
                        style={{ color: `${colors.foreground}40` }}
                    />
                    <p className="text-lg font-medium mb-2" style={{ color: colors.foreground }}>
                        {isFiltered ? "No matching posts" : "No posts yet"}
                    </p>
                    <p className="text-sm" style={{ color: `${colors.foreground}66` }}>
                        {isFiltered ? "Try adjusting your search or filters" : "Check back soon for new articles!"}
                    </p>
                </motion.div>
            )}
        </>
    );
}
