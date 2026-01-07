/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
	  './pages/**/*.{ts,tsx}',
	  './components/**/*.{ts,tsx}',
	  './app/**/*.{ts,tsx}',
	  './src/**/*.{ts,tsx}',
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
		  sans: ['var(--font-nunito-sans)', 'sans-serif'],
		  heading: ['var(--font-nunito)', 'sans-serif'],
		  'rampart': ['var(--font-rampart)', 'cursive'],
		  'serif': ['var(--font-libre-baskerville)', 'Georgia', 'serif'],
		},
		colors: {
		  border: "hsl(var(--border))",
		  input: "hsl(var(--input))",
		  ring: "hsl(var(--ring))",
		  background: "hsl(var(--background))",
		  foreground: "hsl(var(--foreground))",
		  primary: {
			DEFAULT: "hsl(var(--primary))",
			foreground: "hsl(var(--primary-foreground))",
		  },
		  secondary: {
			DEFAULT: "hsl(var(--secondary))",
			foreground: "hsl(var(--secondary-foreground))",
		  },
		  destructive: {
			DEFAULT: "hsl(var(--destructive))",
			foreground: "hsl(var(--destructive-foreground))",
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
		},
		borderRadius: {
		  lg: "var(--radius)",
		  md: "calc(var(--radius) - 2px)",
		  sm: "calc(var(--radius) - 4px)",
		},
		keyframes: {
		  "accordion-down": {
			from: { height: 0 },
			to: { height: "var(--radix-accordion-content-height)" },
		  },
		  "accordion-up": {
			from: { height: "var(--radix-accordion-content-height)" },
			to: { height: 0 },
		  },
		  "move-arrow": {
			"0%, 100%": { transform: "translateX(0)" },
			"50%": { transform: "translateX(4px)" },
		  },
		  wave: {
			'from': { transform: 'rotate(-10deg)' },
			'to': { transform: 'rotate(30deg)' }
		  },
		  "float-slow": {
			"0%, 100%": { transform: "translateY(0) rotate(0deg)", opacity: "0.4" },
			"50%": { transform: "translateY(-8px) rotate(10deg)", opacity: "0.6" },
		  },
		  "float-medium": {
			"0%, 100%": { transform: "translateY(0) rotate(0deg)", opacity: "0.3" },
			"50%": { transform: "translateY(-6px) rotate(-8deg)", opacity: "0.5" },
		  },
		  "float-fast": {
			"0%, 100%": { transform: "translateY(0) scale(1)", opacity: "0.3" },
			"50%": { transform: "translateY(-4px) scale(1.1)", opacity: "0.5" },
		  },
		  "bounce-gentle": {
			"0%, 100%": { transform: "translateY(0)" },
			"50%": { transform: "translateY(-6px)" },
		  },
		  "fade-in-up": {
			"0%": { opacity: "0", transform: "translateY(10px)" },
			"100%": { opacity: "1", transform: "translateY(0)" },
		  },
		},
		animation: {
		  "accordion-down": "accordion-down 0.2s ease-out",
		  "accordion-up": "accordion-up 0.2s ease-out",
		  "move-arrow": "move-arrow 1s ease-in-out infinite",
		  wave: 'wave 1s infinite alternate ease-in-out',
		  "float-slow": "float-slow 3s ease-in-out infinite",
		  "float-medium": "float-medium 2.5s ease-in-out infinite 0.3s",
		  "float-fast": "float-fast 2s ease-in-out infinite 0.6s",
		  "bounce-gentle": "bounce-gentle 2s ease-in-out infinite",
		  "fade-in-up": "fade-in-up 0.5s ease-out forwards",
		},
	  },
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
  }