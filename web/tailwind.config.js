/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07070a",
          900: "#0a0a0a",
          850: "#111114",
          800: "#17171c",
          700: "#1f1f27",
        },
        accent: {
          DEFAULT: "#6366f1",
          soft: "#818cf8",
          deep: "#4f46e5",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        sheet: "0 -8px 40px rgba(0,0,0,0.45)",
      },
      maxWidth: {
        phone: "430px",
        desk: "1120px",
      },
    },
  },
  plugins: [],
};
