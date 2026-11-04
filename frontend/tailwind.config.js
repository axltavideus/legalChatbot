/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette — navy / white / gold accent
        navy: {
          50:  '#eef2f7',
          100: '#d4dff0',
          200: '#a9bfe0',
          300: '#7e9fd1',
          400: '#537fc1',
          500: '#2b5fab',  // primary navy
          600: '#1e4a8a',
          700: '#163869',
          800: '#0e2648',
          900: '#071327',
        },
        gold: {
          400: '#f5c842',
          500: '#e6b400',
        },
      },
      fontFamily: {
        // Serif for headings (legal feel)
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans:  ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

