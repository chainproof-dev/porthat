import { useTheme } from "../../context/ThemeContext";

interface BlogContentProps {
    content: string;
}

export default function BlogContent({ content }: BlogContentProps) {
    const { colors, mode } = useTheme();

    // Convert markdown-like content to basic HTML
    const renderContent = (text: string) => {
        const lines = text.split("\n");
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
                        <pre
                            key={`code-${index}`}
                            className="my-4 sm:my-6 p-4 rounded-xl overflow-x-auto text-sm"
                            style={{
                                backgroundColor: mode === "dark" ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.05)",
                                border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                            }}
                        >
                            <code style={{ color: mode === "dark" ? "#e5e5e5" : "#1a1a1a" }}>
                                {codeContent.join("\n")}
                            </code>
                        </pre>
                    );
                    codeContent = [];
                    inCodeBlock = false;
                } else {
                    // Start code block
                    inCodeBlock = true;
                    codeLanguage = line.slice(3);
                }
                return;
            }

            if (inCodeBlock) {
                codeContent.push(line);
                return;
            }

            // Headers
            if (line.startsWith("# ")) {
                elements.push(
                    <h1
                        key={index}
                        className="text-2xl sm:text-3xl font-bold mt-8 mb-4 first:mt-0"
                        style={{ color: colors.foreground }}
                    >
                        {line.slice(2)}
                    </h1>
                );
                return;
            }

            if (line.startsWith("## ")) {
                elements.push(
                    <h2
                        key={index}
                        className="text-xl sm:text-2xl font-semibold mt-8 mb-3"
                        style={{ color: colors.foreground }}
                    >
                        {line.slice(3)}
                    </h2>
                );
                return;
            }

            if (line.startsWith("### ")) {
                elements.push(
                    <h3
                        key={index}
                        className="text-lg sm:text-xl font-semibold mt-6 mb-2"
                        style={{ color: colors.foreground }}
                    >
                        {line.slice(4)}
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

            // Lists
            if (line.match(/^(\d+)\. /)) {
                const match = line.match(/^(\d+)\. (.+)/);
                if (match) {
                    elements.push(
                        <div key={index} className="my-1 flex gap-2 ml-4">
                            <span style={{ color: colors.primary }} className="font-medium">
                                {match[1]}.
                            </span>
                            <span style={{ color: `${colors.foreground}cc` }}>{renderInlineFormatting(match[2])}</span>
                        </div>
                    );
                }
                return;
            }

            if (line.startsWith("- ")) {
                elements.push(
                    <div key={index} className="my-1 flex gap-2 ml-4">
                        <span style={{ color: colors.primary }}>•</span>
                        <span style={{ color: `${colors.foreground}cc` }}>{renderInlineFormatting(line.slice(2))}</span>
                    </div>
                );
                return;
            }

            // Table detection (basic)
            if (line.startsWith("|") && line.endsWith("|")) {
                const cells = line.slice(1, -1).split("|").map(c => c.trim());
                if (cells.every(c => c.match(/^-+$/))) {
                    // Separator row, skip
                    return;
                }
                elements.push(
                    <div
                        key={index}
                        className="grid gap-4 my-1 py-2 px-3 rounded-lg text-sm"
                        style={{
                            gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
                            backgroundColor: mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                        }}
                    >
                        {cells.map((cell, i) => (
                            <span key={i} style={{ color: `${colors.foreground}cc` }}>
                                {renderInlineFormatting(cell)}
                            </span>
                        ))}
                    </div>
                );
                return;
            }

            // Empty line
            if (line.trim() === "") {
                elements.push(<div key={index} className="h-2" />);
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
    };

    // Handle inline formatting
    const renderInlineFormatting = (text: string): React.ReactNode => {
        // Process bold, italic, inline code, and links
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
    };

    const renderBasicFormatting = (text: string, key: number): React.ReactNode => {
        return <span key={key}>{text}</span>;
    };

    return (
        <article className="prose-custom">{renderContent(content)}</article>
    );
}
