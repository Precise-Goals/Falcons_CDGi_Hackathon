/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        crimson: {
          DEFAULT: '#C8102E',
          hover: '#A60D26',
          tint: '#FDECEF',
        },
        cream: {
          DEFAULT: '#FAF7F2',
          card: '#FFFFFF',
          subtle: '#F4EFEB',
          border: '#E8E2D9',
        },
        black: {
          DEFAULT: '#0A0A0A',
          muted: '#4A4A4A',
          border: '#1F1F1F',
          subtle: '#141414',
        },
        sumi: '#0A0A0A',
        washi: '#FAF7F2',
        ash: '#525252',
      },
      fontFamily: {
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Montserrat', 'Poppins', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(10, 10, 10, 0.04)',
        washi: '0 1px 3px rgba(10, 10, 10, 0.05), 0 1px 2px rgba(10, 10, 10, 0.03)',
        card: '0 4px 6px -1px rgba(10, 10, 10, 0.05), 0 2px 4px -1px rgba(10, 10, 10, 0.03)',
        capsule: '0 10px 30px -5px rgba(10, 10, 10, 0.08), 0 0 0 1px rgba(10, 10, 10, 0.06)',
      },
    },
  },
  plugins: [],
};
