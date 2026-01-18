import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import portfolioData from "../data/data.json";
import {
  createSEOConfigFromProfile,
  generateMetaTags,
  generateLinkTags,
} from "../lib/seo";
import { generateHomePageSchemas } from "../lib/schema";
import { JsonLd } from "../components/seo/JsonLd";
import type { Profile } from "../types/portfolio";

// =============================================================================
// SEO CONFIGURATION
// =============================================================================

const { profile, roles, socials } = portfolioData;
const seoConfig = createSEOConfigFromProfile(profile as Profile);

// Extract social URLs for schema sameAs
const socialUrls = socials.map((s: { url: string }) => s.url);

// Generate structured data schemas
const schemas = generateHomePageSchemas(
  profile as Profile,
  seoConfig,
  roles,
  socialUrls
);

// =============================================================================
// ROUTE DEFINITION
// =============================================================================

export const Route = createRootRoute({
  head: () => ({
    meta: generateMetaTags(
      {
        title: profile.name,
        description: profile.bio,
        type: "profile",
      },
      seoConfig
    ),
    links: generateLinkTags(seoConfig, profile as Profile, appCss),
  }),
  shellComponent: RootDocument,
});

// =============================================================================
// ROOT DOCUMENT COMPONENT
// =============================================================================

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <JsonLd data={schemas} />
        {/* Skip to content link styles */}
        <style>{`
          .skip-to-content {
            position: absolute;
            left: -9999px;
            z-index: 9999;
            padding: 0.75rem 1rem;
            background: #0a0a0a;
            color: #fafafa;
            text-decoration: none;
            font-size: 0.875rem;
            font-weight: 500;
            border-radius: 0 0 0.5rem 0;
          }
          .skip-to-content:focus {
            left: 0;
            top: 0;
            outline: 2px solid #fafafa;
            outline-offset: 2px;
          }
        `}</style>
      </head>
      <body>
        {/* Skip to Content Link for Accessibility */}
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <main id="main-content">
          {children}
        </main>
        <Scripts />
      </body>
    </html>
  );
}
