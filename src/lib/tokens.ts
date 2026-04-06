/**
 * CalGrid design tokens — single source of truth for brand values
 * shared between Tailwind config, CSS custom properties, and runtime code.
 */

export const tokens = {
  color: {
    brand: {
      primary: "#4A7A2E",
      primaryDark: "#3D6B25",
      primaryDeep: "#325A1E",
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
    secondary: {
      primary: "#B8860B",
      light: "#D4A017",
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
  font: {
    serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  shadow: {
    editorial: "0 1px 3px rgba(0,0,0,0.08)",
    editorialHover: "0 4px 12px rgba(0,0,0,0.12)",
  },
  section: {
    transmission: { label: "California Transmission", color: "#4A7A2E" },
    energy: { label: "California Energy", color: "#B8860B" },
    labor: { label: "California Labor", color: "#1565C0" },
    local: { label: "Local Coverage", color: "#D32F2F" },
  },
} as const;

export type SectionKey = keyof typeof tokens.section;
