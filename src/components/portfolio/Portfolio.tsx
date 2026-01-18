import { motion } from "framer-motion";
import { ThemeProvider, useTheme } from "../../context/ThemeContext";
import { ANIMATION } from "../../lib/constants";
import { Hero, Experience, Education, Projects, SkillSlider, Blog, Footer, GitHubChart, SpotifyWidget, IllustrationOverlay } from "./index";
import type { PortfolioData } from "../../types/portfolio";
import FluidBackground from "../FluidBackground";
import ErrorBoundary from "../common/ErrorBoundary";

interface PortfolioProps {
  data: PortfolioData;
}

function PortfolioContent({ data }: PortfolioProps) {
  const { colors, fluidEnabled } = useTheme();

  return (
    <div style={{ backgroundColor: colors.background, minHeight: "100vh" }}>
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(circle, ${colors.foreground}14 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />
      <FluidBackground
        className="fixed inset-0 z-0"
        enabled={fluidEnabled}
        config={{
          TRANSPARENT: true,
        }}
      />
      <motion.div
        className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 z-10"
        initial="hidden"
        animate="visible"
        variants={ANIMATION.stagger}
      >
        <Hero profile={data.profile} roles={data.roles} socials={data.socials} />

        <motion.section variants={ANIMATION.fadeIn} className="mb-6">
          <p className="text-xs sm:text-sm mb-2 sm:mb-3" style={{ color: `${colors.foreground}99` }}>
            My <span style={{ color: colors.foreground }} className="font-medium">skills</span>
          </p>
          <SkillSlider skills={data.skills} />
        </motion.section>

        <GitHubChart username={data.github} />
        <SpotifyWidget />
        <Experience experiences={data.experience} />
        <Education education={data.education} />
        <Projects projects={data.projects} />
        <Blog blogs={data.blogs} />
        <Footer quotes={data.quotes} handle={data.profile.handle} />
      </motion.div>

      {data.illustration && <IllustrationOverlay />}
    </div>
  );
}

export default function Portfolio({ data }: PortfolioProps) {
  return (
    <ErrorBoundary>
      <ThemeProvider initialTheme={data.theme}>
        <PortfolioContent data={data} />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
