/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Malgun Gothic', '맑은 고딕', 'Arial', 'sans-serif']
      }
    }
  },
  plugins: []
};
