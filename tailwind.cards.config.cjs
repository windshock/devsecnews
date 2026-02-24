/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./cards/**/cards.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Noto Sans KR',
          'Apple SD Gothic Neo',
          'Malgun Gothic',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },
      colors: {
        node: '#4ade80',
        java: '#fb923c',
        edit: '#a78bfa',
      },
    },
  },
  plugins: [],
};
