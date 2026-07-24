/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Anti-generic system: pitch-black canvas, translucent slate glass,
        // acid-lime as the single loud accent, mint = good, coral = deficit.
        canvas: "#050507",
        surface: "#0E0F14",
        acid: "#CCFF00",
        mint: "#00FF9D",
        coral: "#FF2A54",
        amberlite: "#FFB84D",
      },
      fontFamily: {
        // Mono for micro-caps terminal labels, Grotesk for numeric gauges.
        mono: ["SpaceMono_400Regular"],
        "mono-bold": ["SpaceMono_700Bold"],
        display: ["SpaceGrotesk_500Medium"],
        "display-bold": ["SpaceGrotesk_700Bold"],
      },
    },
  },
  plugins: [],
};
