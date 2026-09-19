import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "Outfit", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Outfit", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        pine: {
          50: "#f0fbf3",
          100: "#dcf3e2",
          200: "#b9e7c5",
          300: "#86d39b",
          400: "#4eb86d",
          500: "#2b9a4c",
          600: "#1e7c3b",
          700: "#186030",
          800: "#0f4523",
          900: "#07361b", // Deep Forest Pine
          950: "#042211", // Deepest Forest
        },
        sage: {
          50: "#f3f8f4",
          100: "#e3f0e6",
          200: "#c8e4ce",
          300: "#a3d3ad",
          400: "#76bb85",
          500: "#51a162",
          600: "#3d814d",
          700: "#33673f",
          800: "#2b5334",
          900: "#24452c",
        },
        tangerine: {
          50: "#fff8f1",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#ff6b00", // Signature vibrant CTA orange from reference
          600: "#eb5e00",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
      },
    },
  },
  plugins: [],
};
export default config;
