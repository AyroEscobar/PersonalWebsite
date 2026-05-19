/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:        '#07080d',
        panel:     '#0c0e14',
        'panel-hi':'#11141c',
        border:    '#1f2532',
        line:      '#161a24',
        ink:       '#d4dde9',
        dim:       '#6b7689',
        muted:     '#424b5e',
        cyan:      '#6dd5ff',
        amber:     '#ffb86b',
        green:     '#6ee7a3',
        red:       '#ff6b8a',
        yellow:    '#f5d76e',
        magenta:   '#d99cff',
      },
      fontFamily: {
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        blink:  { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
        fadeUp: { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scan:   { from: { transform: 'translateY(-100%)' }, to: { transform: 'translateY(100%)' } },
      },
      animation: {
        blink:  'blink 1.1s steps(2,start) infinite',
        fadeUp: 'fadeUp 0.6s ease both',
        scan:   'scan 6s linear infinite',
      },
    },
  },
  plugins: [],
}
