/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#282828',
          panel: '#1d2021',
          surface: '#32302f',
          border: '#504945',
        },
        accent: {
          blue: '#458588',
          warn: '#d79921',
          danger: '#cc241d',
          ok: '#689d6a',
        },
        text: {
          primary: '#ebdbb2',
          secondary: '#a89984',
          muted: '#665c54',
        },
      },
    },
  },
  plugins: [],
}
