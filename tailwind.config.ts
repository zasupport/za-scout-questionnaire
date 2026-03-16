import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0D2233",
        teal: "#1B5C56",
        "teal-light": "#27504D",
        "za-green": "#0FEA7A",
        "za-heading": "#1B6B4A",
        slate: "#2C3E50",
        mid: "#64748B",
        "row-alt": "#F8FAFC",
        "teal-bg": "#EAF4F2",
      },
    },
  },
  plugins: [],
};
export default config;
