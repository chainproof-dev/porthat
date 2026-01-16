/**
 * Schema.org Structured Data Generators
 * JSON-LD schemas for SEO
 */

import type { Profile, BlogPost } from "@/types/portfolio";
import type { SEOConfig } from "./seo";

// =============================================================================
// SCHEMA TYPES
// =============================================================================

export interface PersonSchema {
    "@context": "https://schema.org";
    "@type": "Person";
    name: string;
    url: string;
    image?: string;
    jobTitle?: string;
    description?: string;
    email?: string;
    sameAs?: string[];
}

export interface WebSiteSchema {
    "@context": "https://schema.org";
    "@type": "WebSite";
    name: string;
    url: string;
    description?: string;
    author?: { "@type": "Person"; name: string };
}

export interface ArticleSchema {
    "@context": "https://schema.org";
    "@type": "Article";
    headline: string;
    description: string;
    image?: string;
    datePublished?: string;
    author?: { "@type": "Person"; name: string };
    publisher?: { "@type": "Person"; name: string };
}

export interface BreadcrumbItem {
    name: string;
    url: string;
}

export interface BreadcrumbListSchema {
    "@context": "https://schema.org";
    "@type": "BreadcrumbList";
    itemListElement: Array<{
        "@type": "ListItem";
        position: number;
        name: string;
        item: string;
    }>;
}

// =============================================================================
// GENERATORS
// =============================================================================

/**
 * Generate Person schema for the portfolio owner
 */
export function generatePersonSchema(
    profile: Profile,
    config: SEOConfig,
    roles: string[],
    socialUrls: string[] = []
): PersonSchema {
    return {
        "@context": "https://schema.org",
        "@type": "Person",
        name: profile.name,
        url: config.siteUrl,
        image: profile.avatar,
        jobTitle: roles[0], // Primary role
        description: profile.bio,
        email: profile.email ? `mailto:${profile.email}` : undefined,
        sameAs: socialUrls.length > 0 ? socialUrls : undefined,
    };
}

/**
 * Generate WebSite schema for sitelinks and searchbox
 */
export function generateWebSiteSchema(
    config: SEOConfig,
    profile: Profile
): WebSiteSchema {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: config.siteName,
        url: config.siteUrl,
        description: profile.bio,
        author: {
            "@type": "Person",
            name: profile.name,
        },
    };
}

/**
 * Generate Article schema for blog posts
 */
export function generateArticleSchema(
    blog: BlogPost,
    authorName: string
): ArticleSchema {
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: blog.title,
        description: blog.excerpt,
        image: blog.coverImage,
        datePublished: blog.date,
        author: {
            "@type": "Person",
            name: authorName,
        },
        publisher: {
            "@type": "Person",
            name: authorName,
        },
    };
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(
    items: BreadcrumbItem[]
): BreadcrumbListSchema {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem" as const,
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

/**
 * Serialize schema to JSON-LD string for script tag
 */
export function serializeSchema(
    schema: PersonSchema | WebSiteSchema | ArticleSchema | BreadcrumbListSchema
): string {
    return JSON.stringify(schema, null, 0);
}

/**
 * Generate combined schemas for the homepage
 */
export function generateHomePageSchemas(
    profile: Profile,
    config: SEOConfig,
    roles: string[],
    socialUrls: string[]
): Array<PersonSchema | WebSiteSchema> {
    return [
        generatePersonSchema(profile, config, roles, socialUrls),
        generateWebSiteSchema(config, profile),
    ];
}
