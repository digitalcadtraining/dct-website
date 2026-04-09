/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        dct: {
          dark:      "#1F1A17",
          navy:      "#003C6E",
          blue:      "#024981",
          primary:   "#007BBF",
          gray:      "#6A6B6D",
          lightgray: "#7E7F81",
        },
      },
      fontFamily: {
        sans: ["'DM Sans'", "ui-sans-serif", "system-ui"],
      },
      backgroundImage: {
        "dct-gradient": "linear-gradient(135deg, #003C6E 0%, #007BBF 100%)",
        "dct-gradient-soft": "linear-gradient(135deg, #024981 0%, #007BBF 100%)",
        "dct-gradient-hero": "linear-gradient(135deg, #1F1A17 0%, #003C6E 50%, #007BBF 100%)",
      },
      animation: {
        "fade-in":    "fadeIn 0.4s ease-out",
        "slide-up":   "slideUp 0.4s ease-out",
        "slide-in":   "slideIn 0.3s ease-out",
        "scale-in":   "scaleIn 0.2s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:    { "0%": { opacity: "0" },                              "100%": { opacity: "1" } },
        slideUp:   { "0%": { opacity: "0", transform: "translateY(20px)" },"100%": { opacity: "1", transform: "translateY(0)" } },
        slideIn:   { "0%": { opacity: "0", transform: "translateX(-20px)" },"100%": { opacity: "1", transform: "translateX(0)" } },
        scaleIn:   { "0%": { opacity: "0", transform: "scale(0.95)" },     "100%": { opacity: "1", transform: "scale(1)" } },
        pulseSoft: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.7" } },
      },
      screens: { "2xl": "1440px" },
      boxShadow: {
        card:  "0 2px 12px rgba(0,60,110,0.08)",
        "card-hover": "0 8px 24px rgba(0,60,110,0.14)",
        modal: "0 20px 60px rgba(0,60,110,0.18)",
      },
    },
  },
  plugins: [],
};
