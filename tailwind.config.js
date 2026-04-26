/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        blurFadeUp: {
          '0%':   { opacity: '0', filter: 'blur(20px)', transform: 'translateY(40px)' },
          '100%': { opacity: '1', filter: 'blur(0)',    transform: 'translateY(0)' },
        },
      },
      animation: {
        'blur-fade-up': 'blurFadeUp 1000ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
}
