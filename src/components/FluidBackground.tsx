import { useEffect, useRef } from 'react';
import FluidSimulation, { FluidConfig } from '../lib/fluidSimulation';

interface Props {
    className?: string;
    config?: Partial<FluidConfig>;
}

export default function FluidBackground({ className, config }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fluidRef = useRef<FluidSimulation | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Determine mobile/desktop config adjustments
        const isMobile = window.innerWidth < 768;
        const mobileConfig: Partial<FluidConfig> = isMobile ? {
            DYE_RESOLUTION: 512,
            SIM_RESOLUTION: 128,
            SPLAT_RADIUS: 0.4, // Larger splats for touch
            SPLAT_FORCE: 5000,
            BLOOM_ITERATIONS: 4, // Reduce work on mobile
            BLOOM_RESOLUTION: 128, // Lower bloom resolution
        } : {};

        // Initialize simulation with merged config
        const finalConfig = { ...config, ...mobileConfig };
        const fluid = new FluidSimulation(canvas, finalConfig);
        fluidRef.current = fluid;
        fluid.init();

        // Event listeners
        const handleMouseDown = (e: MouseEvent) => {
            fluid.handlePointerDown(-1, e.offsetX, e.offsetY);
        };

        const handleMouseMove = (e: MouseEvent) => {
            fluid.handlePointerMove(-1, e.offsetX, e.offsetY);
        };

        const handleMouseUp = () => {
            fluid.handlePointerUp(-1);
        };

        const handleTouchStart = (e: TouchEvent) => {
            // e.preventDefault(); // allow scroll
            for (let i = 0; i < e.targetTouches.length; i++) {
                const t = e.targetTouches[i];
                // Touch coordinates need to be mapped to client or offset
                // Since canvas is fixed 100vw/100vh, clientX/Y roughly equals offset if no scrolling involved?
                // Wait, if we scroll, clientY changes? No, clientY is viewport relative. 
                // Fluid canvas is fixed to viewport. So clientX/Y is correct relative to canvas!
                // offset coordinates in touch events are not standard.
                fluid.handlePointerDown(t.identifier, t.clientX, t.clientY);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            // e.preventDefault();
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

        // We add listeners to window or canvas?
        // If canvas covers everything, canvas is fine.
        // But if we want scroll, the canvas is in the background. 
        // IF content is ON TOP of canvas, the canvas won't receive events if content has background or handles them.
        // BUT we want simultaneous.
        // One way: `pointer-events: none` on content? No, need to click links.
        // `pointer-events: none` on Canvas? Then canvas gets NO events.

        // Solution:
        // 1. Canvas is `pointer-events: auto`.
        // 2. Content is `pointer-events: auto`.
        // We attach listeners to the WINDOW or a shared container to capture events for the fluid, 
        // PASSING them through to the fluid simulation regardless of what was clicked.
        // However, coordinate transformation is needed.

        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        // For touch, if we want scroll, we bind passively.
        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            fluid.destroy();
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [config]);

    // Handle config updates if needed? For now, re-init on mount is simple.

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{
                width: '100vw',
                height: '100vh',
                display: 'block'
            }}
        />
    );
}
