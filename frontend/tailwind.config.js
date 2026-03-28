/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        'radio-dark':    '#0d0d10',
        'radio-surface': '#16161d',
        'radio-accent':  '#00e5ff',
      },
      keyframes: {
        progress: {
          '0%':   { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      animation: {
        progress: 'progress 30s linear infinite',
      },
    },
  },
  plugins: [],
};
