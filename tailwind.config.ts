import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0A0A08",
          surface: "#111109",
          elevated: "#1A1A14",
        },
        gold: {
          DEFAULT: "#D4A853",
          light: "#E8C47A",
          dark: "#A87E30",
        },
        front: {
          business: "#4CAF7D",
          school: "#4A90D9",
          health: "#E8973A",
        },
        cream: {
          DEFAULT: "#F5F0E8",
          muted: "#8A8578",
        },
        danger: "#E05A5A",
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "stone-pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "complete-flash": "flash 0.6s ease-out",
        "avatar-walk": "walk 0.8s ease-in-out",
      },
      keyframes: {
        flash: {
          "0%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        walk: {
          "0%": { transform: "translateX(0)" },
          "50%": { transform: "translateY(-4px)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
