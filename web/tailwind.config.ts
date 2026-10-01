import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#14532d",
        sage: "#4ade80",
        surface: "#f8fafc",
        muted: "#64748b",
        line: "#e2e8f0",
      },
    },
  },
  plugins: [],
} satisfies Config;
