module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0a0a0a",
          800: "#1a1a1a",
          700: "#2a2a2a",
          500: "#666666",
          400: "#9a9a9a",
        },
        bone: {
          50: "#ffffff",
          100: "#f5f3ee",
          200: "#ecebe5",
          300: "#dedbd1",
        },
        accent: {
          DEFAULT: "#ff3b00",
          hover: "#e03400",
          soft: "#ffe5d9",
        },
        rust: "#c1440e",
        moss: "#4a5d3a",
        ochre: "#d4a017",
        line: "rgba(10,10,10,0.10)",
        "line-strong": "rgba(10,10,10,0.18)",
      },
      fontFamily: {
        display: ["'Cabinet Grotesk'", "'Inter Tight'", "system-ui", "sans-serif"],
        serif: ["'Fraunces'", "Georgia", "serif"],
        body: ["'Satoshi'", "'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        slidein: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        slidein: "slidein 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
