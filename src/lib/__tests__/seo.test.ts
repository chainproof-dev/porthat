import { describe, it, expect } from "vitest";
import {
    getSEOConfig,
    generateMetaTags,
    generateLinkTags,
    createSEOConfigFromProfile,
} from "../seo";
import type { Profile } from "@/types/portfolio";

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

// =============================================================================
// TESTS
// =============================================================================

describe("SEO Utilities", () => {
    describe("getSEOConfig", () => {
        it("should return default SEO configuration", () => {
            const config = getSEOConfig();

            expect(config).toHaveProperty("siteName");
            expect(config).toHaveProperty("siteUrl");
            expect(config).toHaveProperty("defaultImage");
            expect(config).toHaveProperty("locale");
            expect(config.locale).toBe("en_US");
        });
    });

    describe("createSEOConfigFromProfile", () => {
        it("should create SEO config from profile data", () => {
            const config = createSEOConfigFromProfile(mockProfile);

            expect(config.siteName).toBe(mockProfile.name);
            expect(config.locale).toBe("en_US");
        });
    });

    describe("generateMetaTags", () => {
        it("should generate basic meta tags", () => {
            const config = getSEOConfig();
            const meta = generateMetaTags(
                {
                    title: "Test Page",
                    description: "Test description",
                },
                config
            );

            expect(meta).toBeInstanceOf(Array);
            expect(meta.length).toBeGreaterThan(0);

            // Check for essential meta tags
            const hasCharset = meta.some((m) => m.charSet === "utf-8");
            const hasViewport = meta.some((m) => m.name === "viewport");
            const hasTitle = meta.some((m) => m.title !== undefined);
            const hasDescription = meta.some(
                (m) => m.name === "description" && m.content === "Test description"
            );

            expect(hasCharset).toBe(true);
            expect(hasViewport).toBe(true);
            expect(hasTitle).toBe(true);
            expect(hasDescription).toBe(true);
        });

        it("should include Open Graph tags", () => {
            const config = getSEOConfig();
            const meta = generateMetaTags(
                {
                    title: "Test Page",
                    description: "Test description",
                    type: "website",
                },
                config
            );

            const hasOgType = meta.some(
                (m) => m.property === "og:type" && m.content === "website"
            );
            const hasOgTitle = meta.some((m) => m.property === "og:title");
            const hasOgDescription = meta.some((m) => m.property === "og:description");

            expect(hasOgType).toBe(true);
            expect(hasOgTitle).toBe(true);
            expect(hasOgDescription).toBe(true);
        });

        it("should include Twitter Card tags", () => {
            const config = getSEOConfig();
            const meta = generateMetaTags(
                {
                    title: "Test Page",
                    description: "Test description",
                },
                config
            );

            const hasTwitterCard = meta.some(
                (m) => m.name === "twitter:card" && m.content === "summary_large_image"
            );
            const hasTwitterTitle = meta.some((m) => m.name === "twitter:title");

            expect(hasTwitterCard).toBe(true);
            expect(hasTwitterTitle).toBe(true);
        });

        it("should include noindex when specified", () => {
            const config = getSEOConfig();
            const meta = generateMetaTags(
                {
                    title: "Private Page",
                    description: "Hidden page",
                    noindex: true,
                },
                config
            );

            const hasNoindex = meta.some(
                (m) => m.name === "robots" && m.content === "noindex, nofollow"
            );

            expect(hasNoindex).toBe(true);
        });
    });

    describe("generateLinkTags", () => {
        it("should generate link tags with stylesheet and canonical", () => {
            const config = getSEOConfig();
            const links = generateLinkTags(config, mockProfile, "/styles.css");

            expect(links).toBeInstanceOf(Array);
            expect(links.length).toBeGreaterThan(0);

            const hasStylesheet = links.some(
                (l) => l.rel === "stylesheet" && l.href === "/styles.css"
            );
            const hasCanonical = links.some((l) => l.rel === "canonical");
            const hasIcon = links.some((l) => l.rel === "icon");

            expect(hasStylesheet).toBe(true);
            expect(hasCanonical).toBe(true);
            expect(hasIcon).toBe(true);
        });
    });
});
