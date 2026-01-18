import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

interface ReadingProgressProps {
    /** Target element ID to track scroll progress for (defaults to document) */
    targetId?: string;
}

/**
 * Reading progress indicator component
 * Displays a progress bar at the top of the viewport showing scroll progress
 */
export default function ReadingProgress({ targetId }: ReadingProgressProps) {
    const { colors } = useTheme();
    const [progress, setProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const updateProgress = () => {
            let scrolled: number;
            let height: number;

            if (targetId) {
                const target = document.getElementById(targetId);
                if (target) {
                    const rect = target.getBoundingClientRect();
                    const targetTop = window.scrollY + rect.top;
                    const targetHeight = target.scrollHeight;
                    scrolled = Math.max(0, window.scrollY - targetTop);
                    height = targetHeight - window.innerHeight;
                } else {
                    return;
                }
            } else {
                scrolled = window.scrollY;
                height = document.documentElement.scrollHeight - window.innerHeight;
            }

            const newProgress = Math.min(100, Math.max(0, (scrolled / height) * 100));
            setProgress(newProgress);

            // Show progress bar after scrolling past 5%
            setIsVisible(scrolled > 100);
        };

        // Throttled scroll handler for performance
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateProgress();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        updateProgress(); // Initial call

        return () => window.removeEventListener("scroll", handleScroll);
    }, [targetId]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isVisible ? 1 : 0 }}
            className="fixed top-0 left-0 right-0 z-[60] h-1"
            style={{
                backgroundColor: `${colors.primary}20`,
            }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Reading progress"
        >
            <motion.div
                className="h-full"
                style={{
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary || colors.primary})`,
                }}
                transition={{ duration: 0.1 }}
            />
        </motion.div>
    );
}
