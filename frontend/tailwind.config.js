import plugin from 'tailwindcss/plugin'

// Colours come only from the v2 tokens in src/styles/tokens.css (DESIGN.md 2). The
// default Tailwind palette is replaced, not extended, so off-palette colours cannot
// ship. Opacity modifiers work through color-mix:
//   text-accent/60  ->  color-mix(in oklab, var(--accent) 60%, transparent)
// The kit itself is plain CSS (components.css, glass.css); Tailwind is here for its
// preflight and the odd layout utility.
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
      base: token('base'),
      plate: token('plate'),
      ink: token('ink'),
      'ink-2': token('ink-2'),
      'ink-3': token('ink-3'),
      'on-ink': token('on-ink'),
      accent: token('accent'),
      'accent-ink': token('accent-ink'),
      ok: token('ok'),
      'ok-ink': token('ok-ink'),
      hair: 'var(--hair)',
      // Only so Tailwind's preflight placeholder colour resolves to a token.
      gray: { 400: 'var(--ink-3)' },
    },
    // Two voices, no monospace (DESIGN.md 2.3).
    fontFamily: {
      sans: ['var(--sans)'],
      serif: ['var(--serif)'],
    },
    fontSize: {
      xs: ['var(--t-xs)', { lineHeight: '1.4' }],
      sm: ['var(--t-sm)', { lineHeight: '1.5' }],
      md: ['var(--t-md)', { lineHeight: '1.55' }],
      lg: ['var(--t-lg)', { lineHeight: '1.45' }],
      xl: ['var(--t-xl)', { lineHeight: '1.3' }],
      '2xl': ['var(--t-2xl)', { lineHeight: '1.1' }],
      '3xl': ['var(--t-3xl)', { lineHeight: '1' }],
      display: ['var(--t-display)', { lineHeight: '0.98', letterSpacing: '-0.01em' }],
    },
    borderRadius: {
      none: '0',
      1: 'var(--r-1)',
      2: 'var(--r-2)',
      3: 'var(--r-3)',
      4: 'var(--r-4)',
      5: 'var(--r-5)',
      full: 'var(--r-full)',
    },
    boxShadow: {
      none: 'none',
    },
    extend: {
      maxWidth: {
        measure: 'var(--measure)',
        page: 'var(--page-max)',
      },
      spacing: {
        gutter: 'var(--gutter)',
      },
      transitionTimingFunction: {
        press: 'var(--ease-press)',
        sheet: 'var(--ease-sheet)',
        morph: 'var(--ease-morph)',
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      // Motion exists only behind both gates (DESIGN.md 2.5).
      addVariant('motion-ok', '@media (prefers-reduced-motion: no-preference) { html:not([data-motion="reduced"]) & }')
      // The quiet switch (solid panels instead of glass) and the render tier, set on <html>.
      addVariant('quiet', 'html[data-transparency="reduced"] &')
      addVariant('tier-lite', 'html[data-tier="lite"] &')
      // JavaScript is up (set by the inline boot script).
      addVariant('js', 'html[data-js] &')
      addVariant('no-js', 'html:not([data-js]) &')
      addVariant('pointer-fine', '@media (hover: hover) and (pointer: fine)')
    }),
  ],
}
