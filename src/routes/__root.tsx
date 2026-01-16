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
      </head>
      <body>{children}<Scripts /></body>
    </html>
  );
}
