/**
 * SEO Configuration and Utilities
 * Centralized SEO management for the portfolio
 */

import type { Profile } from "@/types/portfolio";

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface SEOConfig {
    siteName: string;
    siteUrl: string;
    defaultImage: string;
    twitterHandle?: string;
    locale: string;
}

/**
 * Get SEO configuration from environment or defaults
 */
export function getSEOConfig(): SEOConfig {
    const siteUrl = import.meta.env.VITE_SITE_URL || "http://localhost:3000";
    return {
        siteName: "Portfolio",
        siteUrl,
        defaultImage: `${siteUrl}/assets/ogimg.png`,
        twitterHandle: undefined,
        locale: "en_US",
    };
}

// =============================================================================
// META TAG GENERATORS
// =============================================================================

export interface PageMeta {
    title: string;
    description: string;
    image?: string;
    type?: "website" | "article" | "profile";
    canonical?: string;
    noindex?: boolean;
}

/**
 * Generate meta tags array for TanStack Router head()
 */
export function generateMetaTags(page: PageMeta, config: SEOConfig) {
    // Avoid duplication: if title already contains siteName, use as-is
    // Otherwise append "| Portfolio"
    let fullTitle: string;
    if (page.title === config.siteName) {
        fullTitle = `${page.title} | Portfolio`;
    } else if (page.title.includes(config.siteName)) {
        fullTitle = page.title;
    } else {
        fullTitle = `${page.title} | ${config.siteName}`;
    }
    const image = page.image || config.defaultImage;
    const canonical = page.canonical || config.siteUrl;

    const meta: Array<{ [key: string]: string }> = [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: fullTitle },
        { name: "description", content: page.description },

        // Open Graph
        { property: "og:type", content: page.type || "website" },
        { property: "og:url", content: canonical },
        { property: "og:title", content: fullTitle },
        { property: "og:description", content: page.description },
        { property: "og:image", content: image },
        { property: "og:site_name", content: config.siteName },
        { property: "og:locale", content: config.locale },

        // Twitter
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:url", content: canonical },
        { name: "twitter:title", content: fullTitle },
        { name: "twitter:description", content: page.description },
        { name: "twitter:image", content: image },

        // Theme
        { name: "theme-color", content: "#0a0a0a" },
    ];

    // Add twitter handle if configured
    if (config.twitterHandle) {
        meta.push({ name: "twitter:creator", content: config.twitterHandle });
    }

    // Add noindex if specified
    if (page.noindex) {
        meta.push({ name: "robots", content: "noindex, nofollow" });
    }

    return meta;
}

/**
 * Generate link tags for head
 */
export function generateLinkTags(
    config: SEOConfig,
    profile: Profile,
    stylesheetUrl: string
) {
    return [
        { rel: "stylesheet", href: stylesheetUrl },
        { rel: "canonical", href: config.siteUrl },
        { rel: "icon", type: "image/x-icon", href: profile.avatar },
        { rel: "apple-touch-icon", href: profile.avatar },
    ];
}

// =============================================================================
// SITENAME BUILDER FROM PROFILE
// =============================================================================

/**
 * Create SEO config from portfolio data
 */
export function createSEOConfigFromProfile(profile: Profile): SEOConfig {
    const baseConfig = getSEOConfig();
    return {
        ...baseConfig,
        siteName: profile.name,
    };
}
