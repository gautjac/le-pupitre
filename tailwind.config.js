/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Le Pupitre — a studio mixing desk at night. Deep metal, VU amber, MIDI cyan.
        desk: {
          black: "#0c0e12",
          DEFAULT: "#13161d",
          panel: "#191d26",
          rail: "#222733",
          edge: "#2e3543",
          line: "#3a4150",
        },
        ink: {
          DEFAULT: "#eef2f7",
          soft: "#aab4c2",
          dim: "#6f7b8b",
        },
        amber: { DEFAULT: "#f6a821", glow: "#ffc24d", deep: "#b9760a" },
        cyan: { DEFAULT: "#33d6dd", glow: "#7df0f4", deep: "#127a80" },
        lime: { DEFAULT: "#5be08a", deep: "#1f7a45" },
        rose: { DEFAULT: "#ff5d77", deep: "#a31f37" },
        violet: { DEFAULT: "#9b8cff", deep: "#5546b8" },
        // channel-strip tints (8 channels)
        ch: {
          1: "#ff6b6b",
          2: "#f59e42",
          3: "#f6c945",
          4: "#5be08a",
          5: "#33d6dd",
          6: "#4f9dff",
          7: "#9b8cff",
          8: "#ff7ad1",
        },
      },
      fontFamily: {
        display: ['"Chakra Petch"', "system-ui", "sans-serif"],
        sans: ['"Space Grotesk"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 18px 40px -24px rgba(0,0,0,0.9)",
        slot: "0 2px 6px -2px rgba(0,0,0,0.8) inset",
        glowamber: "0 0 0 1px rgba(246,168,33,0.4), 0 0 18px -2px rgba(246,168,33,0.5)",
        glowcyan: "0 0 0 1px rgba(51,214,221,0.45), 0 0 18px -2px rgba(51,214,221,0.55)",
        glowlime: "0 0 0 1px rgba(91,224,138,0.45), 0 0 16px -2px rgba(91,224,138,0.5)",
      },
      keyframes: {
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        flash: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        pulse2: {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        riseIn: "riseIn 0.4s ease-out both",
        flash: "flash 0.5s ease-out forwards",
        pulse2: "pulse2 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
