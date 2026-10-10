/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        crimson: {
          DEFAULT: '#C8102E',
          hover: '#A60D26',
          tint: '#FBE9EC',
        },
        sumi: '#0A0A0B',
        washi: '#FAF8F5',
        ash: '#6B6B70',
      },
      fontFamily: {
        display: ['"Shippori Mincho"', '"Noto Serif JP"', 'serif'],
        sans: ['Inter', '"Noto Sans JP"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        washi: '0 1px 3px rgba(10, 10, 11, 0.05), 0 1px 2px rgba(10, 10, 11, 0.03)',
        card: '0 4px 6px -1px rgba(10, 10, 11, 0.05), 0 2px 4px -1px rgba(10, 10, 11, 0.03)',
      },
    },
  },
  plugins: [],
};
