import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Detects search crawlers, bots, and AI agents
 * Used to disable expensive effects like fluid simulations
 */
export function isCrawler(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  const bots = [
    'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot',
    'sogou', 'exabot', 'facebot', 'facebookexternalhit', 'ia_archiver',
    'gptbot', 'ccbot', 'claude-web', 'chatgpt-user', 'google-extended',
    'semrushbot', 'ahrefsbot', 'dotbot', 'mj12bot', 'bytespider'
  ];

  const isBot = bots.some(bot => userAgent.includes(bot));
  const isWebdriver = window.navigator.webdriver;

  return isBot || !!isWebdriver;
}
