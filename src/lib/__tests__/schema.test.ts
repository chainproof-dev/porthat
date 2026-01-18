import { describe, it, expect } from "vitest";
import {
    generatePersonSchema,
    generateWebSiteSchema,
    generateArticleSchema,
    generateBreadcrumbSchema,
    generateHomePageSchemas,
} from "../schema";
import type { Profile, BlogPost } from "@/types/portfolio";
import type { SEOConfig } from "../seo";

// =============================================================================
// TEST DATA
// =============================================================================

const mockProfile: Profile = {
    name: "Test User",
    handle: "testuser",
    avatar: "https://example.com/avatar.jpg",
    banner: "https://example.com/banner.jpg",
    bio: "A test user bio for testing purposes.",
    location: "Test City",
    resumeUrl: "https://example.com/resume.pdf",
    email: "test@example.com",
};

const mockSEOConfig: SEOConfig = {
    siteName: "Test Site",
    siteUrl: "https://example.com",
    defaultImage: "https://example.com/og.png",
    locale: "en_US",
};

const mockBlogPost: BlogPost = {
    slug: "test-post",
    title: "Test Blog Post",
    date: "2026-01-15",
    excerpt: "This is a test blog post excerpt.",
    tags: ["test", "blog"],
    coverImage: "/images/test.jpg",
    readingTime: "5 min read",
};

// =============================================================================
// TESTS
// =============================================================================

describe("Schema Generators", () => {
    describe("generatePersonSchema", () => {
        it("should generate valid Person schema", () => {
            const roles = ["Developer", "Designer"];
            const socialUrls = ["https://twitter.com/test", "https://github.com/test"];

            const schema = generatePersonSchema(
                mockProfile,
                mockSEOConfig,
                roles,
                socialUrls
            );

            expect(schema["@context"]).toBe("https://schema.org");
            expect(schema["@type"]).toBe("Person");
            expect(schema.name).toBe(mockProfile.name);
            expect(schema.url).toBe(mockSEOConfig.siteUrl);
            expect(schema.image).toBe(mockProfile.avatar);
            expect(schema.jobTitle).toBe(roles[0]);
            expect(schema.description).toBe(mockProfile.bio);
            expect(schema.sameAs).toEqual(socialUrls);
        });

        it("should handle empty social URLs", () => {
            const schema = generatePersonSchema(mockProfile, mockSEOConfig, [], []);

            expect(schema.sameAs).toBeUndefined();
        });
    });

    describe("generateWebSiteSchema", () => {
        it("should generate valid WebSite schema", () => {
            const schema = generateWebSiteSchema(mockSEOConfig, mockProfile);

            expect(schema["@context"]).toBe("https://schema.org");
            expect(schema["@type"]).toBe("WebSite");
            expect(schema.name).toBe(mockSEOConfig.siteName);
            expect(schema.url).toBe(mockSEOConfig.siteUrl);
            expect(schema.description).toBe(mockProfile.bio);
            expect(schema.author).toEqual({
                "@type": "Person",
                name: mockProfile.name,
            });
        });
    });

    describe("generateArticleSchema", () => {
        it("should generate valid Article schema", () => {
            const authorName = "Test Author";
            const schema = generateArticleSchema(mockBlogPost, authorName);

            expect(schema["@context"]).toBe("https://schema.org");
            expect(schema["@type"]).toBe("Article");
            expect(schema.headline).toBe(mockBlogPost.title);
            expect(schema.description).toBe(mockBlogPost.excerpt);
            expect(schema.image).toBe(mockBlogPost.coverImage);
            expect(schema.datePublished).toBe(mockBlogPost.date);
            expect(schema.author).toEqual({
                "@type": "Person",
                name: authorName,
            });
        });
    });

    describe("generateBreadcrumbSchema", () => {
        it("should generate valid BreadcrumbList schema", () => {
            const items = [
                { name: "Home", url: "https://example.com" },
                { name: "Blog", url: "https://example.com/blog" },
                { name: "Post", url: "https://example.com/blog/post" },
            ];

            const schema = generateBreadcrumbSchema(items);

            expect(schema["@context"]).toBe("https://schema.org");
            expect(schema["@type"]).toBe("BreadcrumbList");
            expect(schema.itemListElement).toHaveLength(3);

            // Check first item
            expect(schema.itemListElement[0].position).toBe(1);
            expect(schema.itemListElement[0].name).toBe("Home");
            expect(schema.itemListElement[0].item).toBe("https://example.com");

            // Check last item
            expect(schema.itemListElement[2].position).toBe(3);
            expect(schema.itemListElement[2].name).toBe("Post");
        });
    });

    describe("generateHomePageSchemas", () => {
        it("should generate array with Person and WebSite schemas", () => {
            const roles = ["Developer"];
            const socialUrls = ["https://twitter.com/test"];

            const schemas = generateHomePageSchemas(
                mockProfile,
                mockSEOConfig,
                roles,
                socialUrls
            );

            expect(schemas).toHaveLength(2);
            expect(schemas[0]["@type"]).toBe("Person");
            expect(schemas[1]["@type"]).toBe("WebSite");
        });
    });
});
