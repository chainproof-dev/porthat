import { describe, it, expect } from "vitest";
import {
    THEME_PRESETS,
    getGradient,
    getSectionGradient,
    getGlowColor,
    createThemeFromCoolors,
    parseCoolorsUrl,
} from "../themes";

// =============================================================================
// TESTS
// =============================================================================

describe("Theme Utilities", () => {
    describe("THEME_PRESETS", () => {
        it("should contain all expected theme presets", () => {
            const expectedPresets = [
                "ocean",
                "midnight",
                "sunset",
                "forest",
                "rose",
                "monochrome",
            ];

            expectedPresets.forEach((preset) => {
                expect(THEME_PRESETS).toHaveProperty(preset);
            });
        });

        it("should have both light and dark variants for each preset", () => {
            Object.keys(THEME_PRESETS).forEach((presetName) => {
                const preset = THEME_PRESETS[presetName];
                expect(preset).toHaveProperty("light");
                expect(preset).toHaveProperty("dark");
                expect(preset).toHaveProperty("name");
            });
        });

        it("should have all required color properties in each variant", () => {
            const requiredColors = [
                "primary",
                "secondary",
                "accent",
                "highlight",
                "muted",
                "background",
                "foreground",
                "card",
                "border",
            ];

            Object.keys(THEME_PRESETS).forEach((presetName) => {
                const preset = THEME_PRESETS[presetName];

                requiredColors.forEach((color) => {
                    expect(preset.light).toHaveProperty(color);
                    expect(preset.dark).toHaveProperty(color);
                });
            });
        });
    });

    describe("getGradient", () => {
        it("should return a linear gradient string", () => {
            const colors = THEME_PRESETS.ocean.dark;
            const gradient = getGradient(colors);

            expect(gradient).toContain("linear-gradient");
            expect(gradient).toContain("to right");
            expect(gradient).toContain(colors.primary);
            expect(gradient).toContain(colors.secondary);
        });
    });

    describe("getSectionGradient", () => {
        it("should return different gradients for light and dark modes", () => {
            const colors = THEME_PRESETS.ocean.dark;

            const darkGradient = getSectionGradient(colors, "dark");
            const lightGradient = getSectionGradient(colors, "light");

            expect(darkGradient).not.toBe(lightGradient);
            expect(darkGradient).toContain("linear-gradient");
            expect(lightGradient).toContain("linear-gradient");
        });
    });

    describe("getGlowColor", () => {
        it("should return different glow colors for light and dark modes", () => {
            const colors = THEME_PRESETS.midnight.dark;

            const darkGlow = getGlowColor(colors, "dark");
            const lightGlow = getGlowColor(colors, "light");

            expect(darkGlow).toContain(colors.primary);
            expect(lightGlow).toContain(colors.highlight);
        });
    });

    describe("parseCoolorsUrl", () => {
        it("should parse hex codes from Coolors URL", () => {
            const url = "https://coolors.co/264653-2a9d8f-e9c46a-f4a261-e76f51";
            const hexCodes = parseCoolorsUrl(url);

            expect(hexCodes).toHaveLength(5);
            expect(hexCodes[0]).toBe("#264653");
            expect(hexCodes[1]).toBe("#2a9d8f");
            expect(hexCodes[2]).toBe("#e9c46a");
            expect(hexCodes[3]).toBe("#f4a261");
            expect(hexCodes[4]).toBe("#e76f51");
        });

        it("should return empty array for invalid URL", () => {
            const invalidUrl = "https://example.com/not-a-coolors-url";
            const hexCodes = parseCoolorsUrl(invalidUrl);

            expect(hexCodes).toHaveLength(0);
        });
    });

    describe("createThemeFromCoolors", () => {
        it("should create theme colors from hex codes array", () => {
            const hexCodes = ["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"];

            const darkTheme = createThemeFromCoolors(hexCodes, true);
            const lightTheme = createThemeFromCoolors(hexCodes, false);

            // Check that colors are mapped correctly
            expect(darkTheme.primary).toBe("#264653");
            expect(darkTheme.secondary).toBe("#2a9d8f");
            expect(darkTheme.accent).toBe("#e9c46a");

            // Check mode-specific background/foreground
            expect(darkTheme.background).toBe("#0a0a0a");
            expect(darkTheme.foreground).toBe("#fafafa");
            expect(lightTheme.background).toBe("#fafafa");
            expect(lightTheme.foreground).toBe("#0a0a0a");
        });

        it("should use defaults for missing hex codes", () => {
            const incompleteHexCodes = ["#264653", "#2a9d8f"];

            const theme = createThemeFromCoolors(incompleteHexCodes, true);

            expect(theme.primary).toBe("#264653");
            expect(theme.secondary).toBe("#2a9d8f");
            // Should have fallback values for missing colors
            expect(theme.accent).toBeDefined();
            expect(theme.highlight).toBeDefined();
        });
    });
});
