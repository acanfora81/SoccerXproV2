/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
      "./index.html",
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        boxShadow: {
          'wow': '0 10px 30px rgba(59,130,246,0.15)',
          'header': '0 1px 4px rgba(0,0,0,0.05)',
        },
        colors: {
          brand: '#3b82f6',
          'brand-dark': '#2563eb',
          'surface-light': '#ffffff',
          'surface-dark': '#0b1120',
          'layout-light': '#f7f8fa',
          'layout-dark': '#0a0f1a',
        },
        borderRadius: {
          'md': '10px',
          'lg': '16px',
          'xl': '24px',
        },
      },
    },
    plugins: [],
  };
  