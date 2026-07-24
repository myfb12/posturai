// Raw design tokens. NativeWind classes cover most styling, but SVG fills,
// Animated interpolations, gradients, and shadow colors need real values.
// Keep these in sync with tailwind.config.js.

export const color = {
  canvas: "#050507", // pitch-black app background
  surface: "#0E0F14", // translucent slate glass base
  glassBorder: "rgba(255,255,255,0.08)",
  glassBorderStrong: "rgba(255,255,255,0.14)",

  acid: "#CCFF00", // primary action / active / highlight
  mint: "#00FF9D", // good / optimal metric
  coral: "#FF2A54", // warning / deficiency
  amber: "#FFB84D", // caution / mid

  // zinc scale (matches tailwind) for text hierarchy on black
  zinc100: "#f4f4f5",
  zinc300: "#d4d4d8",
  zinc400: "#a1a1aa",
  zinc500: "#71717a",
  zinc600: "#52525b",
  zinc800: "#27272a",
} as const;

// Band → semantic color, honest 3-step read used everywhere.
export type Band = "good" | "mild" | "deficit";
export const bandColor: Record<Band, string> = {
  good: color.mint,
  mild: color.amber,
  deficit: color.coral,
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  pill: 999,
} as const;
