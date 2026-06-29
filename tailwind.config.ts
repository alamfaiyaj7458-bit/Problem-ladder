import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F8FB",
        "paper-raised": "#FFFFFF",
        ink: "#14171F",
        "ink-soft": "#4B5163",
        "ink-faint": "#8A90A1",
        line: "#DDE1EA",
        "line-strong": "#C3C9D6",
        accent: {
          DEFAULT: "#2451FF",
          soft: "#E7ECFF",
          ink: "#13308C"
        },
        amber: {
          DEFAULT: "#C98A2E",
          soft: "#FBF0DD"
        },
        // Difficulty heat scale: green -> teal -> amber -> orange -> crimson.
        // The progression itself encodes increasing difficulty.
        level: {
          beginner: "#3F8C5F",
          "beginner-soft": "#E4F2EA",
          intermediate: "#2D7D8C",
          "intermediate-soft": "#E2EFF1",
          advanced: "#C98A2E",
          "advanced-soft": "#FBF0DD",
          expert: "#D9622C",
          "expert-soft": "#FCEAE1",
          master: "#B23A48",
          "master-soft": "#F8E5E8"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-lora)", "Georgia", "serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"]
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "14px"
      },
      boxShadow: {
        card: "0 1px 2px rgba(20, 23, 31, 0.04), 0 1px 12px rgba(20, 23, 31, 0.05)",
        rung: "0 0 0 3px rgba(36, 81, 255, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
