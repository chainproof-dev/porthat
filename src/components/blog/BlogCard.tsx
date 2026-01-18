import { motion } from "framer-motion";
import { Clock, MoveUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useTheme } from "../../context/ThemeContext";
import { ANIMATION } from "../../lib/constants";
import type { BlogPost } from "../../types/portfolio";

const GRADIENT_IMAGES = [
    "/assets/gradient1.jpg",
    "/assets/gradient2.jpg",
    "/assets/gradient3.jpg",
    "/assets/gradient4.jpg",
];

interface BlogCardProps {
    blog: BlogPost;
    index: number;
    featured?: boolean;
}

export default function BlogCard({ blog, index, featured = false }: BlogCardProps) {
    const { colors, mode } = useTheme();

    if (featured) {
        return (
            <motion.div variants={ANIMATION.cardItem}>
                <Link
                    to="/blog/$slug"
                    params={{ slug: blog.slug }}
                    className="block group"
                >
                    <motion.article
                        whileHover={{ y: -4 }}
                        className="relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300"
                        style={{
                            backgroundColor: mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.6)",
                            borderColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                        }}
                    >
                        {/* Cover image */}
                        <div className="relative h-48 sm:h-64 overflow-hidden">
                            <img
                                src={blog.coverImage || GRADIENT_IMAGES[index % 4]}
                                alt={blog.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: `linear-gradient(to top, ${mode === "dark" ? "rgba(10,10,10,0.9)" : "rgba(250,250,250,0.9)"} 0%, transparent 60%)`,
                                }}
                            />
                        </div>

                        {/* Content */}
                        <div className="relative p-5 sm:p-6 -mt-20">
                            <div className="flex flex-wrap gap-2 mb-3">
                                {blog.tags.slice(0, 3).map((tag) => (
                                    <span
                                        key={tag}
                                        className="text-[10px] sm:text-xs px-2 py-0.5 rounded-md font-medium"
                                        style={{
                                            backgroundColor: mode === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)",
                                            color: colors.foreground,
                                        }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <h2
                                className="text-lg sm:text-xl font-semibold mb-2 line-clamp-2 transition-colors"
                                style={{ color: colors.foreground }}
                            >
                                {blog.title}
                            </h2>

                            <p
                                className="text-sm mb-4 line-clamp-2"
                                style={{ color: `${colors.foreground}99` }}
                            >
                                {blog.excerpt}
                            </p>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-xs" style={{ color: `${colors.foreground}66` }}>
                                    <span>{blog.date}</span>
                                    {blog.readingTime && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {blog.readingTime}
                                        </span>
                                    )}
                                </div>
                                <MoveUpRight
                                    className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                    style={{ color: `${colors.foreground}50` }}
                                />
                            </div>
                        </div>
                    </motion.article>
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.div variants={ANIMATION.cardItem}>
            <Link
                to="/blog/$slug"
                params={{ slug: blog.slug }}
                className="block group"
            >
                <motion.article
                    whileHover={{ x: 4 }}
                    className="flex gap-4 rounded-xl border p-3 sm:p-4 transition-all backdrop-blur-md"
                    style={{
                        backgroundColor: mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.5)",
                        borderColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `${colors.primary}50`;
                        e.currentTarget.style.backgroundColor = mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
                        e.currentTarget.style.backgroundColor = mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.5)";
                    }}
                >
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-lg overflow-hidden flex-shrink-0 bg-black">
                        <img
                            src={GRADIENT_IMAGES[index % 4]}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        />
                        <div className="absolute inset-0 flex items-center justify-center p-1.5">
                            <img
                                src={blog.coverImage || GRADIENT_IMAGES[index % 4]}
                                alt={blog.title}
                                className="w-full h-full object-cover rounded-md shadow-lg transition-all duration-500 group-hover:scale-[1.02]"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                            <h3
                                className="font-medium text-sm sm:text-base mb-1 transition-colors line-clamp-2"
                                style={{ color: colors.foreground }}
                            >
                                {blog.title}
                            </h3>
                            <div
                                className="flex items-center gap-2 text-[10px] sm:text-xs mb-2"
                                style={{ color: `${colors.foreground}80` }}
                            >
                                <span>{blog.date}</span>
                                {blog.readingTime && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {blog.readingTime}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {blog.tags.slice(0, 3).map((tag) => (
                                <span
                                    key={tag}
                                    className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md"
                                    style={{
                                        backgroundColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                                        color: `${colors.foreground}99`,
                                    }}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    <MoveUpRight
                        className="w-4 h-4 transition-colors flex-shrink-0 self-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        style={{ color: `${colors.foreground}50` }}
                    />
                </motion.article>
            </Link>
        </motion.div>
    );
}
