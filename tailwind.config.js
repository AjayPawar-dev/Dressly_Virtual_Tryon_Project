import tailwindcssAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Base gradient colors
        primary: {
          purple: '#8f04fa7d',
          violet: '#210a60',
          navy: '#06121d',
        },
        
        // shadcn base tokens (adapted to gradient theme)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        
        // Status colors (gradient-derived)
        brand: {
          success: '#6b9f7e',
          progress: '#834ab0',
          pending: '#d4a374',
          error: '#d16b6b',
        },
      },
      backgroundImage: {

  // 🔹 Primary Brand Gradient (buttons / CTAs)
  'gradient-primary':
    'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a855f7 100%)',

  'gradient-primary-hover':
    'linear-gradient(135deg, #5b21b6 0%, #8b5cf6 50%, #c084fc 100%)',

  // 🔹 Hero Section (main landing background)
  'gradient-hero':
    'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #581c87 100%)',

  'gradient-hero-alt':
    'radial-gradient(circle at top, #7c3aed 0%, #1e1b4b 45%, #020617 100%)',

  // 🔹 Cards / Panels
  'gradient-card':
    'linear-gradient(145deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)',

  'gradient-card-hover':
    'linear-gradient(145deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)',

  // 🔹 Accent Highlights
  'gradient-accent':
    'linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)',

  'gradient-accent-soft':
    'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(168,85,247,0.15) 100%)',

  // 🔹 Success / Status
  'gradient-success':
    'linear-gradient(135deg, #16a34a 0%, #4ade80 100%)',

  'gradient-progress':
    'linear-gradient(90deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)',

  // 🔹 Glassmorphism Overlay
  'gradient-glass':
    'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',

},
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(131, 74, 176, 0.4)',
        'glow-purple-lg': '0 0 40px rgba(131, 74, 176, 0.6)',
      },
      animation: {
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(131, 74, 176, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(131, 74, 176, 0.8)' },
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
