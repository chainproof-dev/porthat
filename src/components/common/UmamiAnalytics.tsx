/**
 * Umami Analytics Component
 * 
 * Privacy-first, GDPR-compliant analytics integration.
 * Uses Umami Cloud or self-hosted instance.
 * 
 * Features:
 * - Environment-based configuration
 * - Domain filtering (only tracks on production domains)
 * - Respects Do Not Track browser setting
 * - Defer loading for optimal performance
 * - Excludes search params for cleaner analytics
 * 
 * Setup:
 * 1. Sign up at https://cloud.umami.is or self-host
 * 2. Add your website and get the website-id
 * 3. Set environment variables in .env
 */

interface UmamiConfig {
    /** Umami website ID */
    websiteId: string;
    /** Umami script URL (defaults to cloud) */
    scriptUrl?: string;
    /** Comma-separated list of domains to track */
    domains?: string;
    /** Whether to respect Do Not Track setting */
    respectDoNotTrack?: boolean;
    /** Whether to exclude search params */
    excludeSearch?: boolean;
}

/**
 * Get Umami configuration from environment variables
 */
function getUmamiConfig(): UmamiConfig | null {
    const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;

    // Don't initialize if no website ID is configured
    if (!websiteId || websiteId === "your_umami_website_id") {
        return null;
    }

    return {
        websiteId,
        scriptUrl: import.meta.env.VITE_UMAMI_SCRIPT_URL || "https://cloud.umami.is/script.js",
        domains: import.meta.env.VITE_UMAMI_DOMAINS || undefined,
        respectDoNotTrack: true,
        excludeSearch: true,
    };
}

/**
 * Umami Analytics Component
 * 
 * Renders the Umami tracking script with production-grade configuration.
 * This component should be placed in the document head.
 * 
 * @example
 * ```tsx
 * // In your root layout
 * <head>
 *   <UmamiAnalytics />
 * </head>
 * ```
 */
export default function UmamiAnalytics() {
    const config = getUmamiConfig();

    // Don't render if not configured
    if (!config) {
        return null;
    }

    // Build data attributes
    const dataAttributes: Record<string, string> = {
        "data-website-id": config.websiteId,
    };

    // Add optional domains filter (only tracks on specified domains)
    if (config.domains) {
        dataAttributes["data-domains"] = config.domains;
    }

    // Respect Do Not Track browser setting
    if (config.respectDoNotTrack) {
        dataAttributes["data-do-not-track"] = "true";
    }

    // Exclude search parameters from URLs
    if (config.excludeSearch) {
        dataAttributes["data-exclude-search"] = "true";
    }

    return (
        <script
            defer
            src={config.scriptUrl}
            {...dataAttributes}
        />
    );
}

// =============================================================================
// ANALYTICS UTILITIES
// =============================================================================

/**
 * Track a custom event in Umami
 * 
 * @param eventName - Name of the event to track
 * @param eventData - Optional data to attach to the event
 * 
 * @example
 * ```tsx
 * trackEvent("button_click", { button: "subscribe" });
 * trackEvent("form_submit", { form: "contact" });
 * ```
 */
export function trackEvent(eventName: string, eventData?: Record<string, string | number | boolean>) {
    // Check if umami is available (script loaded)
    if (typeof window !== "undefined" && (window as UmamiWindow).umami) {
        (window as UmamiWindow).umami?.track(eventName, eventData);
    }
}

/**
 * Track a page view in Umami (for SPA navigation)
 * 
 * @param url - URL to track (defaults to current location)
 * @param referrer - Referrer URL
 * 
 * @example
 * ```tsx
 * // On route change
 * trackPageView("/blog/new-post");
 * ```
 */
export function trackPageView(url?: string, referrer?: string) {
    if (typeof window !== "undefined" && (window as UmamiWindow).umami) {
        (window as UmamiWindow).umami?.track(props => ({
            ...props,
            url: url || window.location.pathname,
            referrer: referrer || document.referrer,
        }));
    }
}

// =============================================================================
// TYPES
// =============================================================================

interface UmamiWindow extends Window {
    umami?: {
        track: (
            eventOrCallback: string | ((props: UmamiPageViewProps) => UmamiPageViewProps),
            data?: Record<string, string | number | boolean>
        ) => void;
    };
}

interface UmamiPageViewProps {
    hostname: string;
    language: string;
    referrer: string;
    screen: string;
    title: string;
    url: string;
    website: string;
}
