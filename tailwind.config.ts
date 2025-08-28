
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'inter': ['Inter', 'system-ui', 'sans-serif'],
				'outfit': ['Outfit', 'system-ui', 'sans-serif'],
				'montserrat': ['Montserrat', 'system-ui', 'sans-serif'],
				'sabon': ['Sabon Next', 'serif'],
				'roboto': ['Roboto', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Medical professional color palette - HSL format
				medical: {
					primary: 'hsl(var(--medical-primary))',
					'primary-foreground': 'hsl(var(--medical-primary-foreground))',
					secondary: 'hsl(var(--medical-secondary))',
					'secondary-foreground': 'hsl(var(--medical-secondary-foreground))',
					accent: 'hsl(var(--medical-accent))',
					'accent-foreground': 'hsl(var(--medical-accent-foreground))',
					success: 'hsl(var(--medical-success))',
					'success-foreground': 'hsl(var(--medical-success-foreground))',
					warning: 'hsl(var(--medical-warning))',
					'warning-foreground': 'hsl(var(--medical-warning-foreground))',
					error: 'hsl(var(--medical-error))',
					'error-foreground': 'hsl(var(--medical-error-foreground))',
					blue: {
						50: 'hsl(var(--medical-slate-50))',
						100: 'hsl(var(--medical-slate-100))',
						400: 'hsl(var(--medical-primary))',
						500: 'hsl(var(--medical-primary))',
						600: 'hsl(var(--medical-primary))',
						700: 'hsl(var(--medical-primary))'
					},
					slate: {
						50: 'hsl(var(--medical-slate-50))',
						100: 'hsl(var(--medical-slate-100))',
						200: 'hsl(var(--medical-slate-200))',
						300: 'hsl(var(--medical-slate-300))',
						400: 'hsl(var(--medical-slate-400))',
						500: 'hsl(var(--medical-slate-500))',
						600: 'hsl(var(--medical-slate-600))',
						700: 'hsl(var(--medical-slate-700))',
						800: 'hsl(var(--medical-slate-800))',
						900: 'hsl(var(--medical-slate-900))'
					}
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				// Scroll-driven reveal animations
				'scroll-reveal-up': {
					'0%': { 
						opacity: '0', 
						transform: 'translateY(40%) scale(0.95)', 
						filter: 'blur(10px)' 
					},
					'100%': { 
						opacity: '1', 
						transform: 'translateY(0) scale(1)', 
						filter: 'blur(0px)' 
					}
				},
				'scroll-reveal-down': {
					'0%': { 
						opacity: '0', 
						transform: 'translateY(-40%) scale(0.95)', 
						filter: 'blur(10px)' 
					},
					'100%': { 
						opacity: '1', 
						transform: 'translateY(0) scale(1)', 
						filter: 'blur(0px)' 
					}
				},
				'scroll-reveal-scale': {
					'0%': { 
						opacity: '0', 
						transform: 'translateY(40%) scale(0)', 
						filter: 'blur(10px)' 
					},
					'100%': { 
						opacity: '1', 
						transform: 'translateY(0) scale(1)', 
						filter: 'blur(0px)' 
					}
				},
				'scroll-reveal-fade': {
					'0%': { 
						opacity: '0', 
						filter: 'blur(10px)' 
					},
					'100%': { 
						opacity: '1', 
						filter: 'blur(0px)' 
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				// Scroll-driven animations
				'scroll-reveal-up': 'scroll-reveal-up 1s both',
				'scroll-reveal-down': 'scroll-reveal-down 1s both',
				'scroll-reveal-scale': 'scroll-reveal-scale 1s both',
				'scroll-reveal-fade': 'scroll-reveal-fade 1s both'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
