import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        paper: "#f3f6fb",
        brass: "#a96a00",
        moss: "#0ea66b",
        clay: "#ef4444",
        line: "#e5ebf4",
        primary: "#176cff",
        primarydark: "#123d96",
      },
      fontFamily: {
        display: ["Arial", "Helvetica", "sans-serif"],
        sans: ["Arial", "Helvetica", "sans-serif"],
      },
      borderRadius: {
        sm: "14px",
      },
    },
  },
  plugins: [],
};
export default config;
