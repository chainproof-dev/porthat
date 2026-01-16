/**
 * LazyImage Component
 * Optimized image loading with CLS prevention and lazy loading
 */

import { useState, type CSSProperties } from "react";

interface LazyImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    style?: CSSProperties;
    /**
     * Aspect ratio (e.g., "16/9", "1/1", "4/3")
     * Used to reserve space and prevent CLS when width/height not specified
     */
    aspectRatio?: string;
    /**
     * Loading priority: "lazy" (default) or "eager" (for above-the-fold images)
     */
    priority?: boolean;
    /**
     * Optional blur placeholder color
     */
    placeholderColor?: string;
}

export function LazyImage({
    src,
    alt,
    width,
    height,
    className = "",
    style = {},
    aspectRatio,
    priority = false,
    placeholderColor = "#1a1a1a",
}: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const containerStyle: CSSProperties = {
        position: "relative",
        overflow: "hidden",
        backgroundColor: placeholderColor,
        ...style,
    };

    // Add aspect ratio if specified
    if (aspectRatio) {
        containerStyle.aspectRatio = aspectRatio;
    }

    const imageStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transition: "opacity 0.3s ease",
        opacity: isLoaded ? 1 : 0,
    };

    if (hasError) {
        return (
            <div
                className={className}
                style={{
                    ...containerStyle,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#666",
                    fontSize: "0.875rem",
                }}
                aria-label={alt}
            >
                <span>Image failed to load</span>
            </div>
        );
    }

    return (
        <div className={className} style={containerStyle}>
            <img
                src={src}
                alt={alt}
                width={width}
                height={height}
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                onLoad={() => setIsLoaded(true)}
                onError={() => setHasError(true)}
                style={imageStyle}
            />
        </div>
    );
}
