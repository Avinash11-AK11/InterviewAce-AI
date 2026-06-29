/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F5EFE6',
        'cream-dark': '#EDE4D7',
        'cream-light': '#FAF6F1',
        sage: '#8FAF8F',
        'sage-light': '#B5CDB5',
        'sage-dark': '#6B8F6B',
        sky: '#A8C5DA',
        'sky-light': '#C8DDE9',
        'sky-dark': '#7AAEC8',
        blush: '#F0B8C8',
        'blush-light': '#F7D5E0',
        'blush-dark': '#E891AC',
        peach: '#F5C9A0',
        lavender: '#C4B5D4',
        mint: '#A8D8B9',
        'text-primary': '#3D3530',
        'text-secondary': '#6B5E57',
        'text-muted': '#9B8F8A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
      },
      boxShadow: {
        'neu': '8px 8px 16px #D4CFC8, -8px -8px 16px #FFFFFF',
        'neu-inset': 'inset 4px 4px 8px #D4CFC8, inset -4px -4px 8px #FFFFFF',
        'neu-sm': '4px 4px 8px #D4CFC8, -4px -4px 8px #FFFFFF',
        'neu-lg': '12px 12px 24px #CCC8BF, -12px -12px 24px #FFFFFF',
        'glass': '0 8px 32px rgba(143, 175, 143, 0.15)',
        'card': '0 4px 20px rgba(61, 53, 48, 0.08)',
        'card-hover': '0 8px 32px rgba(61, 53, 48, 0.15)',
      },
      backgroundImage: {
        'gradient-pastel': 'linear-gradient(135deg, #F5EFE6 0%, #E8F4F8 50%, #F0EFF8 100%)',
        'gradient-sage': 'linear-gradient(135deg, #8FAF8F, #B5CDB5)',
        'gradient-sky': 'linear-gradient(135deg, #A8C5DA, #C8DDE9)',
        'gradient-blush': 'linear-gradient(135deg, #F0B8C8, #F7D5E0)',
        'gradient-peach': 'linear-gradient(135deg, #F5C9A0, #FAD9C0)',
        'gradient-hero': 'linear-gradient(135deg, #F5EFE6 0%, #E8F4F8 35%, #F0EFF8 65%, #F5EFE6 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'bounce-soft': 'bounceSoft 2s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
