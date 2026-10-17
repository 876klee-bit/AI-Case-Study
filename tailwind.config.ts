import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        sidebar: 'hsl(var(--sidebar))',
        surface: 'hsl(var(--surface))',
        brand: 'hsl(var(--brand))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
      },
      borderRadius: {
        '2xl': '16px',
        xl: '12px',
        lg: '10px',
        md: '8px',
        sm: '6px',
      },
      boxShadow: {
        subtle: '0 1px 2px hsl(var(--shadow) / 0.04), 0 1px 1px hsl(var(--shadow) / 0.03)',
        float: '0 8px 24px -8px hsl(var(--shadow) / 0.12), 0 1px 2px hsl(var(--shadow) / 0.05)',
      },
      keyframes: {
        blink: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0' } },
        shimmer: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(300%)' } },
        'dot-pulse': { '0%, 80%, 100%': { opacity: '0.25', transform: 'scale(0.85)' }, '40%': { opacity: '1', transform: 'scale(1)' } },
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        shimmer: 'shimmer 1.2s ease-in-out infinite',
        'dot-pulse': 'dot-pulse 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [animate],
};

export default config;
