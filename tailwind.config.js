/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#000000',
        'bg-secondary': '#0a0a0a',
        'bg-card': '#0a0a0a',
        'border': '#1a1a1a',
        'border-hover': '#333333',
        'text-primary': '#ffffff',
        'text-secondary': '#a1a1a1',
        'text-muted': '#666666',
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        'hero': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'hero-md': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        'resend': '12px',
      },
    },
  },
  plugins: [],
};
