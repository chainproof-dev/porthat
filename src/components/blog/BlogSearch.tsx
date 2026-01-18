import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Filter } from "lucide-react";
import Fuse from "fuse.js";
import { useTheme } from "../../context/ThemeContext";
import type { BlogPost } from "../../types/portfolio";

interface BlogSearchProps {
    blogs: BlogPost[];
    onFilter: (filtered: BlogPost[]) => void;
    allTags: string[];
}

/**
 * Blog search and filter component
 * Supports fuzzy search (Fuse.js) and tag filtering
 */
export default function BlogSearch({ blogs, onFilter, allTags }: BlogSearchProps) {
    const { colors, mode } = useTheme();
    const [query, setQuery] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    // Initialize Fuse instance
    const fuse = useMemo(() => {
        return new Fuse(blogs, {
            keys: [
                { name: "title", weight: 0.7 },
                { name: "excerpt", weight: 0.3 },
                { name: "tags", weight: 0.2 },
                { name: "content", weight: 0.1 }
            ],
            threshold: 0.4, // 0.0 = perfect match, 1.0 = match anything
            includeScore: true,
            ignoreLocation: true // Search anywhere in the string
        });
    }, [blogs]);

    // Filtered results
    const filteredBlogs = useMemo(() => {
        let result = blogs;

        // Fuzzy search
        if (query.trim()) {
            const searchResults = fuse.search(query);
            result = searchResults.map(res => res.item);
        }

        // Tag filtering (AND logic with search)
        if (selectedTags.length > 0) {
            result = result.filter((blog) =>
                selectedTags.some((tag) => blog.tags.includes(tag))
            );
        }

        return result;
    }, [blogs, query, selectedTags, fuse]);

    // Notify parent of filtered results
    const handleFilter = useCallback(() => {
        onFilter(filteredBlogs);
    }, [filteredBlogs, onFilter]);

    // Update parent when filter changes
    useMemo(() => {
        handleFilter();
    }, [handleFilter]);

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag)
                ? prev.filter((t) => t !== tag)
                : [...prev, tag]
        );
    };

    const clearFilters = () => {
        setQuery("");
        setSelectedTags([]);
    };

    const hasActiveFilters = query.trim() !== "" || selectedTags.length > 0;

    return (
        <div className="mb-6 space-y-3">
            {/* Search Input */}
            <div className="relative">
                <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: `${colors.foreground}50` }}
                />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search articles..."
                    className="w-full pl-10 pr-20 py-2.5 rounded-xl border backdrop-blur-xl text-sm transition-all focus:outline-none focus:ring-2"
                    style={{
                        backgroundColor: mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.6)",
                        borderColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                        color: colors.foreground,
                        // @ts-expect-error CSS variable
                        "--tw-ring-color": `${colors.primary}50`,
                    }}
                    aria-label="Search blog posts"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="p-1.5 rounded-lg transition-colors cursor-pointer"
                            style={{
                                backgroundColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                                color: `${colors.foreground}80`,
                            }}
                            aria-label="Clear search"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="p-1.5 rounded-lg transition-colors cursor-pointer"
                        style={{
                            backgroundColor: showFilters || selectedTags.length > 0
                                ? `${colors.primary}20`
                                : mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                            color: showFilters || selectedTags.length > 0 ? colors.primary : `${colors.foreground}80`,
                        }}
                        aria-label="Toggle filters"
                        aria-expanded={showFilters}
                    >
                        <Filter className="w-3 h-3" />
                        {selectedTags.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] rounded-full flex items-center justify-center"
                                style={{ backgroundColor: colors.primary, color: "#fff" }}>
                                {selectedTags.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Tag Filters */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-wrap gap-2 pt-2">
                            {allTags.map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer"
                                    style={{
                                        backgroundColor: selectedTags.includes(tag)
                                            ? `${colors.primary}20`
                                            : mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                                        color: selectedTags.includes(tag) ? colors.primary : `${colors.foreground}cc`,
                                        border: `1px solid ${selectedTags.includes(tag) ? colors.primary : "transparent"}`,
                                    }}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results count */}
            {hasActiveFilters && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs"
                    style={{ color: `${colors.foreground}66` }}
                >
                    {filteredBlogs.length} {filteredBlogs.length === 1 ? "result" : "results"} found
                </motion.p>
            )}
        </div>
    );
}
