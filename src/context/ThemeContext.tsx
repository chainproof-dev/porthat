import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { THEME_PRESETS, type ThemeColors, createThemeFromCoolors, parseCoolorsUrl } from "../lib/themes";

// =============================================================================
// TYPES
// =============================================================================

type Mode = "dark" | "light";

interface ThemeContextType {
  /** Current theme colors based on mode and selected theme */
  colors: ThemeColors;
  /** Name of the current theme preset */
  themeName: string;
  /** Current color mode */
  mode: Mode;
  /** Whether fluid simulation background is enabled */
  fluidEnabled: boolean;
  /** Set theme by preset name */
  setTheme: (name: string) => void;
  /** Set color mode with optional view transition animation */
  setMode: (mode: Mode, event?: React.MouseEvent) => void;
  /** Set custom theme from Coolors URL */
  setCustomTheme: (coolorsUrl: string) => void;
  /** Toggle fluid simulation background */
  setFluidEnabled: (enabled: boolean) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEYS = {
  MODE: "portfolio-mode",
  FLUID: "portfolio-fluid",
} as const;

const MOBILE_BREAKPOINT = 768;

// =============================================================================
// CONTEXT
// =============================================================================

const ThemeContext = createContext<ThemeContextType | null>(null);

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Detect if current device is mobile based on viewport width
 * Used to set sensible defaults for performance-heavy features
 */
function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

/**
 * Get initial fluid state from storage or use mobile-aware default
 */
function getInitialFluidState(): boolean {
  if (typeof window === "undefined") return true;

  const stored = localStorage.getItem(STORAGE_KEYS.FLUID);
  if (stored !== null) {
    return stored === "true";
  }

  // Default: OFF on mobile for performance, ON on desktop
  return !isMobileDevice();
}

// =============================================================================
// PROVIDER
// =============================================================================

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: string;
}

export function ThemeProvider({ children, initialTheme = "ocean" }: ThemeProviderProps) {
  // Theme state
  const [themeName, setThemeName] = useState(initialTheme);
  const [customColors, setCustomColors] = useState<{ light: ThemeColors; dark: ThemeColors } | null>(null);

  // Mode state with SSR-safe initialization
  const [mode, setModeState] = useState<Mode>(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem(STORAGE_KEYS.MODE) as Mode) || "dark";
  });

  // Fluid simulation state with mobile-aware default
  const [fluidEnabled, setFluidEnabledState] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return getInitialFluidState();
  });

  // Sync mode class with document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(mode);
  }, [mode]);

  // Theme setters
  const setTheme = useCallback((name: string) => {
    if (THEME_PRESETS[name]) {
      setThemeName(name);
      setCustomColors(null);
    }
  }, []);

  const setMode = useCallback(async (newMode: Mode, event?: React.MouseEvent) => {
    const root = window.document.documentElement;
    const supportsViewTransitions =
      typeof document !== "undefined" &&
      "startViewTransition" in document &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Fallback: instant mode change
    if (!supportsViewTransitions || !event) {
      localStorage.setItem(STORAGE_KEYS.MODE, newMode);
      setModeState(newMode);
      return;
    }

    // Animated circular reveal transition
    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as any).startViewTransition(async () => {
      localStorage.setItem(STORAGE_KEYS.MODE, newMode);
      setModeState(newMode);
    });

    await transition.ready;

    root.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 500,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  }, []);

  const setCustomTheme = useCallback((coolorsUrl: string) => {
    const hexCodes = parseCoolorsUrl(coolorsUrl);
    if (hexCodes.length >= 5) {
      setThemeName("custom");
      setCustomColors({
        dark: createThemeFromCoolors(hexCodes, true),
        light: createThemeFromCoolors(hexCodes, false),
      });
    }
  }, []);

  const setFluidEnabled = useCallback((enabled: boolean) => {
    localStorage.setItem(STORAGE_KEYS.FLUID, String(enabled));
    setFluidEnabledState(enabled);
  }, []);

  // Compute current colors
  const getColors = useCallback((): ThemeColors => {
    if (customColors) {
      return customColors[mode];
    }
    const preset = THEME_PRESETS[themeName] || THEME_PRESETS.ocean;
    return preset[mode];
  }, [customColors, mode, themeName]);

  const contextValue: ThemeContextType = {
    colors: getColors(),
    themeName,
    mode,
    fluidEnabled,
    setTheme,
    setMode,
    setCustomTheme,
    setFluidEnabled,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
