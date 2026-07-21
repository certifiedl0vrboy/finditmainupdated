/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        /* ── FINDIT KENYAN PALETTE ─────────────────────────────────────────
           Inspired by the Kenyan flag (green · red · black · white),
           the warm Nairobi sun, Maasai beadwork, and savanna landscapes.
        ─────────────────────────────────────────────────────────────────── */

        /* Primary brand green — vibrant Kenyan flag green */
        'primary-blue': '#0284C7',

        /* Page background — warm morning-sun cream, not cold grey */
        'alabaster': '#FFF8EE',

        /* Secondary text — rich African earth brown */
        'mocha': '#7C4B2A',

        /* Accent gold — bright African sun / Maasai bead gold */
        'champagne': '#F5A623',

        /* Kenyan flag red — bold, confident, energetic */
        'kenyan-red': '#CE1126',

        /* Savanna gold — warm button highlight */
        'savanna': '#F5A623',

        /* Nairobi sky — fresh vibrant sky blue for info states */
        'nairobi-sky': '#0096C7',

        /* Rich deep green for dark surfaces (headers, footers) */
        'deep-blue': '#075985',

        /* Bright lime-green for hover states and success */
        'light-blue': '#7DD3FC',

        /* Warm white — card surfaces */
        'warm-white': '#FFFDF7',

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"DM Sans"', '"Manrope"', 'sans-serif'],
        serif: ['"Italiana"', '"Playfair Display"', 'serif'],
        manrope: ['"Manrope"', 'sans-serif'],
        dm: ['"DM Sans"', 'sans-serif'],
      },
      backgroundImage: {
        /* Kenyan flag-inspired gradient: sky → gold → red */
        'blue-gradient': 'linear-gradient(135deg, #0284C7 0%, #F5A623 50%, #CE1126 100%)',
        /* Sunrise gradient for hero sections */
        'sunrise': 'linear-gradient(135deg, #0284C7 0%, #7DD3FC 40%, #F5A623 100%)',
        /* Warm card gradient */
        'warm-card': 'linear-gradient(135deg, #FFF8EE 0%, #FFF3DC 100%)',
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        'green-glow': '0 4px 24px rgba(0, 107, 53, 0.25)',
        'gold-glow': '0 4px 24px rgba(245, 166, 35, 0.30)',
        'red-glow': '0 4px 24px rgba(206, 17, 38, 0.20)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "pulse-blue": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0, 107, 53, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(0, 107, 53, 0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "fade-in-up": "fade-in-up 0.7s ease-out forwards",
        "bounce-subtle": "bounce-subtle 0.5s ease-in-out",
        "pulse-blue": "pulse-blue 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
