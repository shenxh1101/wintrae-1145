/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#FBF8F1",
          100: "#F5F0E1",
          200: "#E8DFC4",
          300: "#D4C497",
          400: "#BFA56A",
          500: "#A88A3D",
          600: "#8B6914",
          700: "#6E5210",
          800: "#513B0C",
          900: "#342408",
        },
        accent: {
          50: "#F0F5EF",
          100: "#E1EBDF",
          200: "#C2D7BE",
          300: "#A4C39E",
          400: "#85AF7D",
          500: "#679B5D",
          600: "#527C4A",
          700: "#3E5D38",
          800: "#293E25",
          900: "#151F13",
        },
        paper: {
          50: "#FEFDFB",
          100: "#FDFAF3",
          200: "#FAF4E7",
          300: "#F5F0E1",
          400: "#EFE6D5",
          500: "#E8DBC9",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "serif"],
        sans: ['"Noto Sans SC"', "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 8px rgba(139, 105, 20, 0.1)",
        "card-hover": "0 8px 24px rgba(139, 105, 20, 0.15)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
