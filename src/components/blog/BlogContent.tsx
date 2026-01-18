import { useMemo, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface BlogContentProps {
    content: string;
}

// Utility to generate slug from heading text
function generateHeadingId(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

// Code block component with copy functionality
function CodeBlock({
    content,
    language,
    mode,
    colors
}: {
    content: string;
    language: string;
    mode: string;
    colors: { foreground: string; primary: string };
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = content;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="relative group my-4 sm:my-6">
            {/* Language badge */}
            {language && (
                <div
                    className="absolute top-0 left-4 px-2 py-0.5 text-[10px] font-medium rounded-b-md"
                    style={{
                        backgroundColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                        color: `${colors.foreground}80`,
                    }}
                >
                    {language}
                </div>
            )}

            {/* Copy button */}
            <motion.button
                onClick={handleCopy}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute top-2 right-2 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                style={{
                    backgroundColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                    color: copied ? colors.primary : `${colors.foreground}80`,
                }}
                aria-label={copied ? "Copied!" : "Copy code"}
            >
                {copied ? (
                    <Check className="w-4 h-4" />
                ) : (
                    <Copy className="w-4 h-4" />
                )}
            </motion.button>

            <pre
                className="p-4 pt-8 rounded-xl overflow-x-auto text-sm"
                style={{
                    backgroundColor: mode === "dark" ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.05)",
                    border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                }}
            >
                <code style={{ color: mode === "dark" ? "#e5e5e5" : "#1a1a1a" }}>
                    {content}
                </code>
            </pre>
        </div>
    );
}

export default function BlogContent({ content }: BlogContentProps) {
    const { colors, mode } = useTheme();

    // Memoized inline formatting renderer
    const renderBasicFormatting = useCallback((text: string, key: number): React.ReactNode => {
        return <span key={key}>{text}</span>;
    }, []);

    // Memoized inline formatting with bold, italic, code, links
    const renderInlineFormatting = useCallback((text: string): React.ReactNode => {
        const parts: React.ReactNode[] = [];
        let remaining = text;
        let key = 0;

        while (remaining.length > 0) {
            // Inline code
            const codeMatch = remaining.match(/`([^`]+)`/);
            if (codeMatch && codeMatch.index !== undefined) {
                if (codeMatch.index > 0) {
                    parts.push(renderBasicFormatting(remaining.slice(0, codeMatch.index), key++));
                }
                parts.push(
                    <code
                        key={key++}
                        className="px-1.5 py-0.5 rounded text-sm font-mono"
                        style={{
                            backgroundColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                            color: colors.foreground,
                        }}
                    >
                        {codeMatch[1]}
                    </code>
                );
                remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
                continue;
            }

            // Bold
            const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
            if (boldMatch && boldMatch.index !== undefined) {
                if (boldMatch.index > 0) {
                    parts.push(renderBasicFormatting(remaining.slice(0, boldMatch.index), key++));
                }
                parts.push(
                    <strong key={key++} style={{ color: colors.foreground }} className="font-semibold">
                        {boldMatch[1]}
                    </strong>
                );
                remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
                continue;
            }

            // Italic
            const italicMatch = remaining.match(/\*([^*]+)\*/);
            if (italicMatch && italicMatch.index !== undefined) {
                if (italicMatch.index > 0) {
                    parts.push(renderBasicFormatting(remaining.slice(0, italicMatch.index), key++));
                }
                parts.push(
                    <em key={key++} className="italic">
                        {italicMatch[1]}
                    </em>
                );
                remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
                continue;
            }

            // No more matches, add the rest
            parts.push(remaining);
            break;
        }

        return parts.length === 1 ? parts[0] : <>{parts}</>;
    }, [colors.foreground, mode, renderBasicFormatting]);

    // Memoized content renderer
    const renderedContent = useMemo(() => {
        const lines = content.split("\n");
        const elements: React.ReactNode[] = [];
        let inCodeBlock = false;
        let codeContent: string[] = [];
        let codeLanguage = "";

        lines.forEach((line, index) => {
            // Code block handling
            if (line.startsWith("```")) {
                if (inCodeBlock) {
                    // End code block
                    elements.push(
                        <CodeBlock
                            key={`code-${index}`}
                            content={codeContent.join("\n")}
                            language={codeLanguage}
                            mode={mode}
                            colors={colors}
                        />
                    );
                    codeContent = [];
                    inCodeBlock = false;
                } else {
                    // Start code block
                    inCodeBlock = true;
                    codeLanguage = line.slice(3).trim();
                }
                return;
            }

            if (inCodeBlock) {
                codeContent.push(line);
                return;
            }

            // Headers with IDs for TOC navigation
            if (line.startsWith("# ")) {
                const headingText = line.slice(2);
                const headingId = generateHeadingId(headingText);
                elements.push(
                    <h1
                        key={index}
                        id={headingId}
                        className="text-2xl sm:text-3xl font-bold mt-8 mb-4 first:mt-0 scroll-mt-24"
                        style={{ color: colors.foreground }}
                    >
                        {headingText}
                    </h1>
                );
                return;
            }

            if (line.startsWith("## ")) {
                const headingText = line.slice(3);
                const headingId = generateHeadingId(headingText);
                elements.push(
                    <h2
                        key={index}
                        id={headingId}
                        className="text-xl sm:text-2xl font-semibold mt-8 mb-3 scroll-mt-24"
                        style={{ color: colors.foreground }}
                    >
                        {headingText}
                    </h2>
                );
                return;
            }

            if (line.startsWith("### ")) {
                const headingText = line.slice(4);
                const headingId = generateHeadingId(headingText);
                elements.push(
                    <h3
                        key={index}
                        id={headingId}
                        className="text-lg sm:text-xl font-semibold mt-6 mb-2 scroll-mt-24"
                        style={{ color: colors.foreground }}
                    >
                        {headingText}
                    </h3>
                );
                return;
            }

            // Horizontal rule
            if (line.startsWith("---")) {
                elements.push(
                    <hr
                        key={index}
                        className="my-8"
                        style={{
                            borderColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                        }}
                    />
                );
                return;
            }

            // Blockquote
            if (line.startsWith("> ")) {
                elements.push(
                    <blockquote
                        key={index}
                        className="my-4 pl-4 border-l-4 italic"
                        style={{
                            borderColor: colors.primary,
                            color: `${colors.foreground}99`,
                        }}
                    >
                        {line.slice(2)}
                    </blockquote>
                );
                return;
            }

            // Ordered lists
            if (line.match(/^(\d+)\. /)) {
                const match = line.match(/^(\d+)\. (.+)/);
                if (match) {
                    elements.push(
                        <div key={index} className="my-1 flex gap-2 ml-4" role="listitem">
                            <span style={{ color: colors.primary }} className="font-medium min-w-[1.5rem]">
                                {match[1]}.
                            </span>
                            <span style={{ color: `${colors.foreground}cc` }}>{renderInlineFormatting(match[2])}</span>
                        </div>
                    );
                }
                return;
            }

            // Unordered lists
            if (line.startsWith("- ")) {
                elements.push(
                    <div key={index} className="my-1 flex gap-2 ml-4" role="listitem">
                        <span style={{ color: colors.primary }} aria-hidden="true">•</span>
                        <span style={{ color: `${colors.foreground}cc` }}>{renderInlineFormatting(line.slice(2))}</span>
                    </div>
                );
                return;
            }

            // Table detection
            if (line.startsWith("|") && line.endsWith("|")) {
                const cells = line.slice(1, -1).split("|").map(c => c.trim());
                if (cells.every(c => c.match(/^-+$/))) {
                    return; // Separator row, skip
                }
                elements.push(
                    <div
                        key={index}
                        className="grid gap-4 my-1 py-2 px-3 rounded-lg text-sm"
                        role="row"
                        style={{
                            gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
                            backgroundColor: mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                        }}
                    >
                        {cells.map((cell, i) => (
                            <span key={i} role="cell" style={{ color: `${colors.foreground}cc` }}>
                                {renderInlineFormatting(cell)}
                            </span>
                        ))}
                    </div>
                );
                return;
            }

            // Empty line
            if (line.trim() === "") {
                elements.push(<div key={index} className="h-2" aria-hidden="true" />);
                return;
            }

            // Regular paragraph
            elements.push(
                <p
                    key={index}
                    className="my-3 leading-relaxed text-sm sm:text-base"
                    style={{ color: `${colors.foreground}cc` }}
                >
                    {renderInlineFormatting(line)}
                </p>
            );
        });

        return elements;
    }, [content, colors, mode, renderInlineFormatting]);

    return (
        <article className="prose-custom" role="article">
            {renderedContent}
        </article>
    );
}
