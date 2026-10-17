/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          900: "#0a0f1a",
          800: "#0f1628",
          700: "#16203a",
          600: "#1e2b4d",
        },
        neon: {
          cyan: "#22d3ee",
          green: "#34d399",
          violet: "#a78bfa",
          amber: "#fbbf24",
          rose: "#fb7185",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
      boxShadow: {
        glow: "0 0 18px rgba(34, 211, 238, 0.35)",
      },
    },
  },
  plugins: [],
};
