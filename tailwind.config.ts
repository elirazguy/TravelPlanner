import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef5ff",
          100: "#d9e8ff",
          200: "#bcd7ff",
          300: "#8ebfff",
          400: "#599cff",
          500: "#3479fc",
          600: "#1f5af1",
          700: "#1846de",
          800: "#1a3bb4",
          900: "#1b378e",
          950: "#152357",
        },
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d4d9e2",
          300: "#aeb7c8",
          400: "#8290a8",
          500: "#62718c",
          600: "#4d5a73",
          700: "#3f495d",
          800: "#373f4f",
          900: "#313744",
          950: "#1d212b",
        },
      },
      fontFamily: {
        sans: ["var(--font-heebo)", "system-ui", "sans-serif"],
        display: ["var(--font-rubik)", "var(--font-heebo)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.10)",
        glass: "0 8px 30px rgba(16,24,40,0.12)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
