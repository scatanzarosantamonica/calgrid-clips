import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // CalGrid green brand scale
        brand: {
          50: "#F0F7EC",
          100: "#DCEFD2",
          200: "#B9DFA6",
          300: "#8EC874",
          400: "#4A7A2E",
          500: "#3D6B25",
          600: "#325A1E",
          700: "#284A18",
          800: "#1E3A12",
          900: "#152B0D",
          950: "#0B1A07",
        },
        // Warm gold/amber secondary
        secondary: {
          50: "#FDF8EB",
          100: "#FAF0D2",
          200: "#F3DDA0",
          300: "#ECCA6E",
          400: "#D4A017",
          500: "#B8860B",
          600: "#9A7009",
          700: "#7D5B08",
          800: "#604606",
          900: "#433104",
          950: "#2B1F03",
        },
        // NYT-inspired editorial palette
        ink: {
          DEFAULT: "#1A1A1A",
          light: "#333333",
          muted: "#666666",
          faint: "#999999",
        },
        paper: {
          DEFAULT: "#FAFAF7",
          warm: "#F5F0E8",
          card: "#FFFFFF",
          hover: "#F7F5F0",
        },
        rule: {
          DEFAULT: "#E0DDD5",
          dark: "#C8C4BB",
          light: "#ECEAE4",
        },
        accent: {
          red: "#D32F2F",
          blue: "#1565C0",
          green: "#4A7A2E",
          gold: "#B8860B",
        },
      },
      fontFamily: {
        serif: [
          "Georgia",
          "Cambria",
          '"Times New Roman"',
          "Times",
          "serif",
        ],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        "headline-1": [
          "2.5rem",
          { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "headline-2": [
          "1.75rem",
          { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "700" },
        ],
        "headline-3": [
          "1.25rem",
          { lineHeight: "1.3", letterSpacing: "-0.005em", fontWeight: "600" },
        ],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        body: ["1rem", { lineHeight: "1.6" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5" }],
        caption: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.02em" }],
        overline: [
          "0.6875rem",
          {
            lineHeight: "1.3",
            letterSpacing: "0.1em",
            fontWeight: "700",
          },
        ],
      },
      spacing: {
        "article-gap": "1.5rem",
        "section-gap": "3rem",
        gutter: "1rem",
      },
      boxShadow: {
        editorial: "0 1px 3px rgba(0,0,0,0.08)",
        "editorial-hover": "0 4px 12px rgba(0,0,0,0.12)",
        "editorial-active": "0 1px 2px rgba(0,0,0,0.05)",
        masthead: "0 1px 0 0 #E0DDD5",
      },
      borderRadius: {
        editorial: "2px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
