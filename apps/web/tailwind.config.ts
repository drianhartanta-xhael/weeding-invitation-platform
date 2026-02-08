import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf8f0',
          100: '#f9eddb',
          200: '#f2d8b6',
          300: '#e8bc87',
          400: '#dd9b56',
          500: '#d4a373',
          600: '#c27d3a',
          700: '#a16330',
          800: '#82502c',
          900: '#6a4327',
        },
      },
    },
  },
  plugins: [],
};

export default config;
