import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Core surfaces
        ink: {
          DEFAULT: "#08090A", // near-black background
          900: "#0B0C0D",
          800: "#121315",
          700: "#18191C",
          600: "#1F2023",
          500: "#2A2B2F",
        },
        line: {
          DEFAULT: "#26272B", // hairline borders
          soft: "#1C1D20",
        },
        paper: {
          DEFAULT: "#F4F3EF", // off-white text
          dim: "#B9B9BC",
          faint: "#7D7E83", // WCAG AA fix (was #7B7C81, 4.46:1 on ink-800): now 4.59:1
        },
        gold: {
          DEFAULT: "#D9A62E", // primary rich gold accent
          bright: "#F2C94C", // hover / highlight
          deep: "#A97D1F", // pressed / borders
          muted: "#8C742E",
        },
        pitch: {
          green: "#478C6E", // used sparingly: positive/verified. WCAG AA fix (was #2E7D5B, 3.72:1 on ink-800) -> 4.64:1, matches signal.success
        },
        signal: {
          // WCAG AA fix: danger/info/success were 3.7–4.3:1 on ink-800 (fail
          // for normal text, AA requires 4.5:1). Lightened just enough to
          // clear 4.5:1 while staying visually the same hue. warn already
          // passed (6.36:1) and is unchanged.
          danger: "#C56158", // was #C1544A, 4.10:1 -> 4.63:1
          warn: "#C98A3A",
          info: "#5184A9", // was #4A7FA6, 4.32:1 -> 4.62:1
          success: "#478C6E", // was #2E7D5B, 3.72:1 -> 4.64:1
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      letterSpacing: {
        widest2: "0.22em",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
        pop: "0 12px 32px -8px rgba(0,0,0,0.55)",
      },
      backgroundImage: {
        "gold-fade": "linear-gradient(180deg, #F2C94C 0%, #D9A62E 60%, #A97D1F 100%)",
        "hairline-fade": "linear-gradient(90deg, transparent, rgba(217,166,46,0.35), transparent)",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "10px",
      },
      keyframes: {
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "rise-in": "rise-in 0.35s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
