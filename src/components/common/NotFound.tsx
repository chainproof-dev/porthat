import { motion, type Variants } from "framer-motion";
import { Home, ArrowLeft, Search, RefreshCw } from "lucide-react";
import { Link, useRouter } from "@tanstack/react-router";
import { useTheme } from "../../context/ThemeContext";
import { getSectionGradient, getGlowColor } from "../../lib/themes";

// =============================================================================
// NOT FOUND COMPONENT
// =============================================================================

/**
 * Production-grade 404 Not Found Page
 * 
 * Features:
 * - Matches portfolio theme and design language
 * - Smooth Framer Motion animations
 * - Dark/light mode responsive
 * - Accessible with proper ARIA attributes
 * - Mobile-responsive layout
 * - Helpful navigation options
 */
export default function NotFound() {
    const { colors, mode } = useTheme();
    const router = useRouter();

    // Animation variants with proper typing
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" as const }
        },
    };

    const glitchVariants: Variants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1] as const
            }
        },
    };

    const handleGoBack = () => {
        if (window.history.length > 1) {
            router.history.back();
        } else {
            router.navigate({ to: "/" });
        }
    };

    return (
        <motion.div
            className="min-h-screen flex items-center justify-center p-6"
            style={{ backgroundColor: colors.background }}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            role="main"
            aria-labelledby="not-found-title"
        >
            {/* Background Glow Effects */}
            <div
                className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-30"
                style={{ background: getGlowColor(colors, mode) }}
            />
            <div
                className="fixed bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
                style={{ background: colors.secondary }}
            />

            <motion.div
                className="relative max-w-lg w-full rounded-2xl p-8 sm:p-12 text-center backdrop-blur-xl border"
                style={{
                    background: getSectionGradient(colors, mode),
                    borderColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                }}
                variants={itemVariants}
            >
                {/* Decorative Glow */}
                <div
                    className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none"
                    style={{ background: getGlowColor(colors, mode) }}
                />

                {/* 404 Number with Gradient */}
                <motion.div
                    className="relative z-10 mb-6"
                    variants={glitchVariants}
                >
                    <h1
                        id="not-found-title"
                        className="text-8xl sm:text-9xl font-bold tracking-tighter"
                        style={{
                            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                    >
                        404
                    </h1>
                    {/* Glitch shadow effect */}
                    <span
                        className="absolute inset-0 text-8xl sm:text-9xl font-bold tracking-tighter opacity-20 blur-sm -z-10"
                        style={{ color: colors.primary }}
                        aria-hidden="true"
                    >
                        404
                    </span>
                </motion.div>

                {/* Message */}
                <motion.div variants={itemVariants} className="relative z-10 mb-8">
                    <h2
                        className="text-xl sm:text-2xl font-semibold mb-3"
                        style={{ color: colors.foreground }}
                    >
                        Page Not Found
                    </h2>
                    <p
                        className="text-sm sm:text-base leading-relaxed"
                        style={{ color: `${colors.foreground}80` }}
                    >
                        Oops! The page you're looking for seems to have wandered off into the void.
                        It might have been moved, deleted, or never existed.
                    </p>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    variants={itemVariants}
                    className="relative z-10 flex flex-col sm:flex-row gap-3 justify-center"
                >
                    {/* Go Home - Primary */}
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
                        style={{
                            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                            color: "#fff",
                            boxShadow: `0 4px 20px ${colors.primary}40`,
                        }}
                    >
                        <Home className="w-4 h-4" />
                        Go Home
                    </Link>

                    {/* Go Back - Secondary */}
                    <button
                        onClick={handleGoBack}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        style={{
                            backgroundColor: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                            color: colors.foreground,
                            border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                        }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </motion.div>

                {/* Helpful Links */}
                <motion.div
                    variants={itemVariants}
                    className="relative z-10 mt-8 pt-6 border-t"
                    style={{ borderColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}
                >
                    <p
                        className="text-xs mb-4"
                        style={{ color: `${colors.foreground}50` }}
                    >
                        You might find what you're looking for here:
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link
                            to="/blog"
                            className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
                            style={{ color: colors.primary }}
                        >
                            <Search className="w-3 h-3" />
                            Browse Blog
                        </Link>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80 cursor-pointer bg-transparent border-none"
                            style={{ color: colors.secondary }}
                        >
                            <RefreshCw className="w-3 h-3" />
                            Refresh Page
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

// =============================================================================
// MINIMAL NOT FOUND (For contexts without ThemeProvider)
// =============================================================================

/**
 * Minimal 404 component for contexts where ThemeProvider might not be available
 * Used as a fallback in the router configuration
 */
export function MinimalNotFound() {
    return (
        <div
            role="main"
            aria-labelledby="not-found-title-minimal"
            className="min-h-screen flex items-center justify-center p-6"
            style={{ backgroundColor: "#0a0a0a" }}
        >
            <div
                className="max-w-md w-full rounded-2xl p-8 text-center"
                style={{
                    backgroundColor: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <h1
                    id="not-found-title-minimal"
                    className="text-7xl font-bold mb-4"
                    style={{
                        background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}
                >
                    404
                </h1>
                <h2
                    className="text-xl font-semibold mb-2"
                    style={{ color: "#fafafa" }}
                >
                    Page Not Found
                </h2>
                <p
                    className="text-sm mb-6"
                    style={{ color: "rgba(250,250,250,0.6)" }}
                >
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <a
                    href="/"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-colors"
                    style={{
                        background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                        color: "#fff",
                    }}
                >
                    ← Go Home
                </a>
            </div>
        </div>
    );
}
