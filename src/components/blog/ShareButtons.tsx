import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Twitter, Linkedin, Facebook, Link2, Check } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface ShareButtonsProps {
    title: string;
    url: string;
    description?: string;
}

/**
 * Social share buttons component
 * Provides share options for Twitter, LinkedIn, Facebook, and copy link
 */
export default function ShareButtons({ title, url, description }: ShareButtonsProps) {
    const { colors, mode } = useTheme();
    const [copied, setCopied] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const encodedTitle = encodeURIComponent(title);
    const encodedUrl = encodeURIComponent(url);
    const encodedDesc = encodeURIComponent(description || "");

    const shareLinks = {
        twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
        linkedin: `https://linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDesc}`,
        facebook: `https://facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const textArea = document.createElement("textarea");
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title, text: description, url });
            } catch {
                // User cancelled
            }
        } else {
            setIsOpen(!isOpen);
        }
    };

    const buttonStyle = {
        backgroundColor: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        color: `${colors.foreground}80`,
    };

    const socialButtons = [
        { name: "Twitter", icon: Twitter, href: shareLinks.twitter, color: "#1DA1F2" },
        { name: "LinkedIn", icon: Linkedin, href: shareLinks.linkedin, color: "#0A66C2" },
        { name: "Facebook", icon: Facebook, href: shareLinks.facebook, color: "#1877F2" },
    ];

    return (
        <div className="relative inline-flex items-center">
            {/* Main share button */}
            <motion.button
                onClick={handleNativeShare}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-colors cursor-pointer"
                style={buttonStyle}
                aria-label="Share article"
                aria-expanded={isOpen}
            >
                <Share2 className="w-4 h-4" />
                Share
            </motion.button>

            {/* Dropdown menu */}
            {isOpen && !navigator.share && (
                <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute top-full left-0 mt-2 p-2 rounded-xl border backdrop-blur-xl z-50 min-w-[160px]"
                    style={{
                        backgroundColor: mode === "dark" ? "rgba(20,20,20,0.95)" : "rgba(255,255,255,0.95)",
                        borderColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                    }}
                >
                    {socialButtons.map(({ name, icon: Icon, href, color }) => (
                        <a
                            key={name}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-opacity-10"
                            style={{
                                color: colors.foreground,
                            }}
                            onClick={() => setIsOpen(false)}
                        >
                            <Icon className="w-4 h-4" style={{ color }} />
                            {name}
                        </a>
                    ))}
                    <hr
                        className="my-2"
                        style={{ borderColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}
                    />
                    <button
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                        style={{ color: colors.foreground }}
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4" style={{ color: colors.primary }} />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Link2 className="w-4 h-4" />
                                Copy link
                            </>
                        )}
                    </button>
                </motion.div>
            )}

            {/* Click outside to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}
        </div>
    );
}
