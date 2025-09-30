
import type {Config} from 'tailwindcss';
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        headline: ["var(--font-sans)", ...fontFamily.sans],
        code: ['monospace'],
      },
      boxShadow: {
        'drop-shadow-black': '0 10px 20px rgba(0, 0, 0, 0.2), 0 6px 6px rgba(0, 0, 0, 0.23)',
      },
      backgroundImage: {
        'shiny-red': 'linear-gradient(135deg, hsl(var(--card-1)) 0%, hsl(0 84.2% 60.2%) 100%)',
        'shiny-yellow': 'linear-gradient(135deg, hsl(var(--card-2)) 0%, hsl(48 95% 55%) 100%)',
        'shiny-blue': 'linear-gradient(135deg, hsl(var(--card-3)) 0%, hsl(var(--accent)) 100%)',
        'shiny-purple': 'linear-gradient(135deg, hsl(var(--card-4)) 0%, hsl(265 80% 60%) 100%)',
        'shiny-green': 'linear-gradient(135deg, hsl(var(--chart-3)) 0%, hsl(150 50% 45%) 100%)',
        'sidebar-gradient': 'radial-gradient(circle at 50% 0, hsl(var(--sidebar-accent)) 0%, hsl(var(--sidebar-background)) 100%)',
        'sidebar-shiny-gradient': 'linear-gradient(180deg, hsl(var(--sidebar-accent)) 0%, hsl(var(--sidebar-background)) 100%)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        'custom-green': '#9FC089',
        'custom-teal': '#79B4B0',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
          '1': 'hsl(var(--card-1))',
          '2': 'hsl(var(--card-2))',
          '3': 'hsl(var(--card-3))',
          '4': 'hsl(var(--card-4))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
