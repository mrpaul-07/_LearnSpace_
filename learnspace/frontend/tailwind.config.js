/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        ui: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        forest: {
          50:  '#f0f5f1',
          100: '#dce7de',
          200: '#b7cfba',
          300: '#8fb394',
          400: '#6a936f',
          500: '#4a7550',
          600: '#355a3b',
          700: '#264426',
          800: '#1a321c',
          900: '#0e1f10'
        },
        cream: {
          50:  '#fbf8f1',
          100: '#f6efdf',
          200: '#ece1c8',
          300: '#ddcfae',
          400: '#c9b98e',
          500: '#b2a06f'
        },
        amber: {
          50:  '#fdf7e5',
          100: '#fbecbf',
          200: '#f7d988',
          300: '#f2c252',
          400: '#e9a928',
          500: '#cc8f17'
        },
        // Remap Tailwind's default blue -> forest green so old utility classes
        // (bg-blue-600, text-blue-600, etc.) adopt the new theme without rewriting every file.
        blue: {
          50:  '#f0f5f1',
          100: '#dce7de',
          200: '#b7cfba',
          300: '#8fb394',
          400: '#6a936f',
          500: '#4a7550',
          600: '#355a3b',
          700: '#264426',
          800: '#1a321c',
          900: '#0e1f10'
        }
      },
      backgroundImage: {
        'paper': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E\")",
        'vintage-radial': "radial-gradient(ellipse at center, #fbf8f1 0%, #f6efdf 50%, #ece1c8 100%)",
        'forest-gradient': "linear-gradient(135deg, #264426 0%, #355a3b 50%, #1a321c 100%)"
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'sparkle': 'sparkle 2.5s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite'
      },
      keyframes: {
        sparkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        }
      },
      boxShadow: {
        'vintage': '0 2px 8px rgba(38, 68, 38, 0.08), 0 1px 2px rgba(38, 68, 38, 0.12)',
        'vintage-lg': '0 10px 30px rgba(38, 68, 38, 0.15), 0 4px 8px rgba(38, 68, 38, 0.08)',
        'inner-paper': 'inset 0 1px 3px rgba(38, 68, 38, 0.06)'
      }
    }
  },
  plugins: []
};
