/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#DC2626',
          hover: '#B91C1C',
        },
        background: '#0F172A',
        surface: '#111827',
        border: '#1F2937',
        text: {
          DEFAULT: '#E5E7EB',
          muted: '#94A3B8',
        },
      },
    },
  },
  plugins: [],
}
