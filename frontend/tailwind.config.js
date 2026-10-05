import plugin from 'tailwindcss/plugin'

// Colours come only from the v3 tokens in src/styles/tokens.css (DESIGN.md 2). The default
// Tailwind palette is replaced, not extended, so off-palette colours cannot ship. The kit
// itself is plain CSS (components.css, glass.css); Tailwind is here for its preflight and
// the odd layout utility.
const token = (name) => `color-mix(in oklab, var(--${name}) calc(<alpha-value> * 100%), transparent)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    screens: {
      sm: '480px',
      md: '640px',
      lg: '1100px',
      xl: '1440px',
      '2xl': '1920px',
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      void: token('void'),
      plate: token('plate'),
      'plate-2': token('plate-2'),
      ink: token('ink'),
      'ink-2': token('ink-2'),
      cyan: token('cyan'),
      // Only so Tailwind's preflight placeholder colour resolves to a token.
      gray: { 400: 'var(--ink-2)' },
    },
    fontFamily: {
      sans: ['var(--sans)'],
      mono: ['var(--mono)'],
    },
    borderRadius: {
      none: '0',
      panel: 'var(--r-panel)',
      card: 'var(--r-card)',
      chip: 'var(--r-chip)',
      inner: 'var(--r-inner)',
      full: 'var(--r-pill)',
    },
    boxShadow: {
      none: 'none',
    },
    extend: {
      maxWidth: {
        page: 'var(--page-max)',
      },
      spacing: {
        gutter: 'var(--gutter)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
        press: 'var(--ease-press)',
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant('quiet', 'html[data-transparency="reduced"] &')
      addVariant('tier-lite', 'html[data-tier="lite"] &')
      addVariant('tier-still', 'html[data-tier="still"] &')
      addVariant('js', 'html[data-js] &')
      addVariant('no-js', 'html:not([data-js]) &')
      addVariant('pointer-fine', '@media (hover: hover) and (pointer: fine)')
    }),
  ],
}
