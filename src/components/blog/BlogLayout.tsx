import { motion } from "framer-motion";
import { ArrowLeft, Sun, Moon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ThemeProvider, useTheme } from "../../context/ThemeContext";
import { ANIMATION } from "../../lib/constants";
import FluidBackground from "../FluidBackground";
import portfolioData from "../../data/data.json";

interface BlogLayoutProps {
    children: React.ReactNode;
}

function BlogLayoutContent({ children }: BlogLayoutProps) {
    const { colors, mode, setMode } = useTheme();

    return (
        <div style={{ backgroundColor: colors.background, minHeight: "100vh" }}>
            {/* Dot pattern background */}
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: `radial-gradient(circle, ${colors.foreground}14 1px, transparent 1px)`,
                    backgroundSize: "24px 24px",
                }}
            />

            {/* Fluid background */}
            <FluidBackground
                className="fixed inset-0 z-0"
                config={{
                    TRANSPARENT: true,
                    BLOOM: true,
                    SUNRAYS: true,
                    DYE_RESOLUTION: 512,
                }}
            />

            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="sticky top-0 z-50 backdrop-blur-xl border-b"
                style={{
                    backgroundColor: mode === "dark" ? "rgba(10,10,10,0.8)" : "rgba(250,250,250,0.8)",
                    borderColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                }}
            >
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                        style={{ color: colors.foreground }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Back to Portfolio</span>
                        <span className="sm:hidden">Back</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/blog"
                            className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                            style={{
                                color: `${colors.foreground}99`,
                                backgroundColor: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                            }}
                        >
                            All Posts
                        </Link>
                        <button
                            onClick={(e) => setMode(mode === "dark" ? "light" : "dark", e)}
                            className="p-2 rounded-lg transition-colors cursor-pointer"
                            style={{
                                backgroundColor: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                                color: colors.foreground,
                            }}
                        >
                            {mode === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* Main content */}
            <motion.main
                className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 z-10"
                initial="hidden"
                animate="visible"
                variants={ANIMATION.stagger}
            >
                {children}
            </motion.main>

            {/* Footer */}
            <footer
                className="relative z-10 border-t py-6"
                style={{
                    borderColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                }}
            >
                <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
                    <p className="text-sm" style={{ color: `${colors.foreground}66` }}>
                        © {new Date().getFullYear()} {portfolioData.profile.name}. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default function BlogLayout({ children }: BlogLayoutProps) {
    return (
        <ThemeProvider initialTheme={portfolioData.theme}>
            <BlogLayoutContent>{children}</BlogLayoutContent>
        </ThemeProvider>
    );
}
