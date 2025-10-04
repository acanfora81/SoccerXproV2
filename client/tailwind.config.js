/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette Automation Mail-like
        brand: '#3b82f6',      // blu principale
        brandDark: '#1e3a8a',  // blu più scuro per gradienti
        surfaceDark: '#0b1120', // sfondo card dark
        // Mappiamo i colori dalle CSS variables esistenti
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        success: 'var(--color-success)',
        'success-hover': 'var(--color-success-hover)',
        warning: 'var(--color-warning)',
        'warning-hover': 'var(--color-warning-hover)',
        danger: 'var(--color-danger)',
        'danger-hover': 'var(--color-danger-hover)',
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        text: 'var(--color-text)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'text-on-accent': 'var(--text-on-accent)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
      },
      fontSize: {
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        wow: '0 10px 30px rgba(59,130,246,0.15)',
      },
      transitionDuration: {
        fast: 'var(--transition-fast)',
        base: 'var(--transition-base)',
      },
    },
  },
  plugins: [],
}
