import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { List, ChevronRight } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface TocItem {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    content: string;
}

function extractHeadings(content: string): TocItem[] {
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const headings: TocItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        headings.push({ id, text, level });
    }

    return headings;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
    const { colors, mode } = useTheme();
    const [activeId, setActiveId] = useState<string>("");
    const [isExpanded, setIsExpanded] = useState(true);

    const headings = useMemo(() => extractHeadings(content), [content]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: "-20% 0% -35% 0%" }
        );

        headings.forEach(({ id }) => {
            const element = document.getElementById(id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => observer.disconnect();
    }, [headings]);

    const scrollToHeading = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    if (headings.length < 2) return null;

    return (
        <motion.nav
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="hidden lg:block sticky top-24 w-64 max-h-[calc(100vh-8rem)] overflow-y-auto"
            aria-label="Table of Contents"
        >
            <div
                className="rounded-xl border backdrop-blur-xl p-4"
                style={{
                    backgroundColor: mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.6)",
                    borderColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                }}
            >
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-between w-full mb-3"
                >
                    <div className="flex items-center gap-2">
                        <List className="w-4 h-4" style={{ color: colors.primary }} />
                        <span
                            className="text-sm font-semibold"
                            style={{ color: colors.foreground }}
                        >
                            On this page
                        </span>
                    </div>
                    <ChevronRight
                        className="w-4 h-4 transition-transform duration-200"
                        style={{
                            color: `${colors.foreground}66`,
                            transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                        }}
                    />
                </button>

                {isExpanded && (
                    <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-1"
                    >
                        {headings.map(({ id, text, level }) => (
                            <li key={id}>
                                <button
                                    onClick={() => scrollToHeading(id)}
                                    className="w-full text-left text-sm py-1.5 px-2 rounded-md transition-all duration-200 hover:bg-opacity-10"
                                    style={{
                                        paddingLeft: `${(level - 1) * 12 + 8}px`,
                                        color: activeId === id ? colors.primary : `${colors.foreground}80`,
                                        backgroundColor: activeId === id
                                            ? `${colors.primary}15`
                                            : "transparent",
                                        fontWeight: activeId === id ? 500 : 400,
                                    }}
                                >
                                    <span className="line-clamp-2">{text}</span>
                                </button>
                            </li>
                        ))}
                    </motion.ul>
                )}
            </div>
        </motion.nav>
    );
}

// Reading time calculator utility
export function calculateReadingTime(content: string): string {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
}

// Word count utility
export function calculateWordCount(content: string): number {
    return content.trim().split(/\s+/).length;
}
