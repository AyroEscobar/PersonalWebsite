import plugin from 'tailwindcss/plugin'

// Colors come only from the SODIUM tokens in src/styles/tokens.css. The default
// Tailwind palette is replaced, not extended, so off-palette colors cannot ship.
// Opacity modifiers work through color-mix, which keeps the Display P3 values:
//   text-sodium/60  ->  color-mix(in oklab, var(--sodium) 60%, transparent)
const token = (name) => `color-mix(in oklab, var(--${name}) calc(<alpha-value> * 100%), transparent)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    screens: {
      sm: '480px',
      md: '720px', // tablet: 8 columns
      lg: '1100px', // desktop: 12 columns, rail visible
      xl: '1440px',
      '2xl': '1920px',
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      night: token('night'),
      deck: token('deck'),
      'deck-2': token('deck-2'),
      ink: token('ink'),
      dim: token('dim'),
      sodium: token('sodium'),
      led: token('led'),
      beacon: token('beacon'),
      trace: token('trace'),
      'trace-lit': token('trace-lit'),
      hairline: 'var(--hairline)',
      // Only so Tailwind's preflight placeholder color resolves to a token. Do not use gray-400.
      gray: { 400: 'var(--dim)' },
    },
    fontFamily: {
      sans: ['"Overpass Dot"', '"Overpass Variable"', '"Overpass Fallback"', 'system-ui', 'sans-serif'],
      display: ['"Overpass Dot"', '"Overpass Variable"', '"Overpass Fallback"', 'system-ui', 'sans-serif'],
      mono: ['"Overpass Mono Variable"', '"Overpass Mono Fallback"', 'ui-monospace', 'monospace'],
    },
    fontSize: {
      display: ['var(--t-display)', { lineHeight: '0.92', letterSpacing: '-0.03em' }],
      h2: ['var(--t-h2)', { lineHeight: '1', letterSpacing: '-0.03em' }],
      h3: ['var(--t-h3)', { lineHeight: '1.2' }],
      lead: ['var(--t-lead)', { lineHeight: '1.5' }],
      body: ['var(--t-body)', { lineHeight: '1.6' }],
      small: ['var(--t-small)', { lineHeight: '1.5' }],
      mono: ['var(--t-mono)', { lineHeight: '1.4' }],
      label: ['12px', { lineHeight: '1.3' }],
    },
    borderRadius: {
      none: '0',
      DEFAULT: 'var(--radius)',
      sm: 'var(--radius)',
      full: '9999px',
    },
    boxShadow: {
      none: 'none',
    },
    extend: {
      maxWidth: {
        measure: '64ch',
        page: 'var(--page-max)',
      },
      spacing: {
        rail: 'var(--rail-w)',
        topbar: 'var(--topbar-h)',
        bottombar: 'var(--bottombar-h)',
        gutter: 'var(--gutter)',
        pad: 'var(--page-pad)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
      },
      transitionDuration: {
        ui: '180ms',
        camera: '800ms',
      },
      zIndex: {
        grid: '0',
        content: '10',
        rail: '40',
        bar: '50',
        dialog: '60',
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      // Motion exists only behind both gates (PLAN.md 4.0 and 6.7).
      addVariant('motion-ok', '@media (prefers-reduced-motion: no-preference) { html:not([data-motion="reduced"]) & }')
      // Quiet mode (the recruiter view) and render tiers, set on <html>.
      addVariant('quiet', 'html[data-mode="quiet"] &')
      addVariant('tier-full', 'html[data-tier="full"] &')
      addVariant('tier-static', 'html[data-tier="static"] &')
      // The first-paint sequence runs only while html[data-boot="run"].
      addVariant('booting', 'html[data-boot="run"] &')
      // JavaScript is up (set by the inline boot script).
      addVariant('js', 'html[data-js] &')
      addVariant('no-js', 'html:not([data-js]) &')
      addVariant('pointer-fine', '@media (pointer: fine)')
      addVariant('hover-hover', '@media (hover: hover)')
    }),
  ],
}
