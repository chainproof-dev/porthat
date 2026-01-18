import { useEffect, useRef, useState, useCallback } from 'react';
import FluidSimulation, { FluidConfig } from '../lib/fluidSimulation';

// =============================================================================
// TYPES
// =============================================================================

interface FluidBackgroundProps {
    /** Additional CSS classes */
    className?: string;
    /** Partial configuration overrides */
    config?: Partial<FluidConfig>;
    /** Whether the fluid simulation is enabled */
    enabled?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MOBILE_BREAKPOINT = 768;

/**
 * Mobile-optimized configuration for better performance
 * Significantly reduces GPU load on mobile devices
 */
const MOBILE_CONFIG: Partial<FluidConfig> = {
    DYE_RESOLUTION: 256,      // Reduced from 512
    SIM_RESOLUTION: 64,       // Reduced from 128
    SPLAT_RADIUS: 0.5,        // Larger splats for touch
    SPLAT_FORCE: 4000,
    BLOOM: false,             // Disable expensive bloom on mobile
    SUNRAYS: false,           // Disable sunrays on mobile
    BLOOM_ITERATIONS: 2,
    BLOOM_RESOLUTION: 64,
    PRESSURE_ITERATIONS: 10,  // Reduce iterations
};

/**
 * Desktop configuration with full visual quality
 */
const DESKTOP_CONFIG: Partial<FluidConfig> = {
    DYE_RESOLUTION: 512,
    SIM_RESOLUTION: 128,
};

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Detect mobile device based on viewport width
 */
function isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function FluidBackground({
    className,
    config,
    enabled = true
}: FluidBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fluidRef = useRef<FluidSimulation | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Intersection observer for lazy loading
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !enabled) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    setIsVisible(entry.isIntersecting);
                });
            },
            { threshold: 0.1 }
        );

        observer.observe(canvas);
        return () => observer.disconnect();
    }, [enabled]);

    // Initialize/destroy fluid simulation based on visibility and enabled state
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !enabled || !isVisible) {
            // Cleanup when disabled or not visible
            if (fluidRef.current) {
                fluidRef.current.destroy();
                fluidRef.current = null;
            }
            return;
        }

        // Already initialized
        if (fluidRef.current) return;

        // Determine device-appropriate config
        const deviceConfig = isMobile() ? MOBILE_CONFIG : DESKTOP_CONFIG;
        const finalConfig = { ...deviceConfig, ...config };

        // Initialize simulation
        const fluid = new FluidSimulation(canvas, finalConfig);
        fluidRef.current = fluid;
        fluid.init();

        // Event handlers with proper coordinate mapping
        const handleMouseDown = (e: MouseEvent) => {
            fluid.handlePointerDown(-1, e.clientX, e.clientY);
        };

        const handleMouseMove = (e: MouseEvent) => {
            fluid.handlePointerMove(-1, e.clientX, e.clientY);
        };

        const handleMouseUp = () => {
            fluid.handlePointerUp(-1);
        };

        const handleTouchStart = (e: TouchEvent) => {
            for (let i = 0; i < e.targetTouches.length; i++) {
                const t = e.targetTouches[i];
                fluid.handlePointerDown(t.identifier, t.clientX, t.clientY);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            for (let i = 0; i < e.targetTouches.length; i++) {
                const t = e.targetTouches[i];
                fluid.handlePointerMove(t.identifier, t.clientX, t.clientY);
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                fluid.handlePointerUp(t.identifier);
            }
        };

        // Attach global listeners for interaction anywhere
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            if (fluidRef.current) {
                fluidRef.current.destroy();
                fluidRef.current = null;
            }
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [config, enabled, isVisible]);

    // Don't render canvas at all when disabled (saves GPU resources)
    if (!enabled) {
        return null;
    }

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{
                width: '100vw',
                height: '100vh',
                display: 'block',
            }}
            aria-hidden="true"
        />
    );
}
