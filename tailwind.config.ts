import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        deep:   '#0D2B1E',
        mid:    '#122E21',
        brand:  '#1A5C3A',
        accent: '#2E8B57',
        glow:   '#3DBA7A',
        light:  '#5FDC9A',
        err:    '#F87171',
      },
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['DM Serif Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
