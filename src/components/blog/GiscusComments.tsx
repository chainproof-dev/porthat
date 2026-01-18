import { useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";

interface GiscusCommentsProps {
    /** GitHub repository in format "owner/repo" */
    repo: string;
    /** Repository ID from Giscus setup */
    repoId: string;
    /** Discussion category name */
    category: string;
    /** Category ID from Giscus setup */
    categoryId: string;
    /** Current page identifier (usually the slug) */
    term?: string;
}

/**
 * Giscus Comments Component
 * 
 * Integrates GitHub Discussions as a comment system.
 * 
 * Setup Instructions:
 * 1. Go to https://giscus.app
 * 2. Enter your repository URL
 * 3. Enable Discussions in your GitHub repo settings
 * 4. Copy the repo, repoId, category, and categoryId values
 * 5. Pass them as props to this component
 */
export default function GiscusComments({
    repo,
    repoId,
    category,
    categoryId,
    term,
}: GiscusCommentsProps) {
    const { mode } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear existing comments when theme changes
        containerRef.current.innerHTML = "";

        // Create script element
        const script = document.createElement("script");
        script.src = "https://giscus.app/client.js";
        script.async = true;
        script.crossOrigin = "anonymous";

        // Giscus configuration
        script.setAttribute("data-repo", repo);
        script.setAttribute("data-repo-id", repoId);
        script.setAttribute("data-category", category);
        script.setAttribute("data-category-id", categoryId);
        script.setAttribute("data-mapping", term ? "specific" : "pathname");
        if (term) {
            script.setAttribute("data-term", term);
        }
        script.setAttribute("data-strict", "0");
        script.setAttribute("data-reactions-enabled", "1");
        script.setAttribute("data-emit-metadata", "0");
        script.setAttribute("data-input-position", "top");
        script.setAttribute("data-theme", mode === "dark" ? "dark_dimmed" : "light");
        script.setAttribute("data-lang", "en");
        script.setAttribute("data-loading", "lazy");

        containerRef.current.appendChild(script);

        return () => {
            // Cleanup on unmount
            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }
        };
    }, [repo, repoId, category, categoryId, term, mode]);

    // Listen for theme changes and update Giscus
    useEffect(() => {
        const iframe = document.querySelector<HTMLIFrameElement>(
            "iframe.giscus-frame"
        );
        if (iframe) {
            iframe.contentWindow?.postMessage(
                {
                    giscus: {
                        setConfig: {
                            theme: mode === "dark" ? "dark_dimmed" : "light",
                        },
                    },
                },
                "https://giscus.app"
            );
        }
    }, [mode]);

    return (
        <section
            ref={containerRef}
            className="giscus-comments mt-8 pt-8 border-t"
            style={{
                borderColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            }}
            aria-label="Comments section"
        />
    );
}

/**
 * Placeholder Comments Component
 * Use this when Giscus is not configured yet
 */
export function CommentsPlaceholder() {
    const { colors, mode } = useTheme();

    return (
        <section
            className="mt-8 pt-8 border-t text-center py-12 rounded-xl"
            style={{
                borderColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                backgroundColor: mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
            }}
        >
            <p className="text-sm mb-2" style={{ color: colors.foreground }}>
                💬 Comments coming soon
            </p>
            <p className="text-xs" style={{ color: `${colors.foreground}66` }}>
                Powered by GitHub Discussions
            </p>
        </section>
    );
}
