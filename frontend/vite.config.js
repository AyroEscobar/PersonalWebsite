import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { defineConfig, transformWithEsbuild } from 'vite'
import react from '@vitejs/plugin-react'
import { HEAD } from './src/content/meta.js'

/*
  Vite config (DESIGN.md 3.1, 3.11, 6.1).

  - __BUILD_SHA__ and __BUILD_DATE__ are injected once per build. scripts/build.mjs
    sets BUILD_SHA and BUILD_DATE in the environment so the client build and the
    prerender build carry the same values (hydration must match).
  - The <head> is written from src/content/meta.js, so copy has one home and
    check-content covers it. index.html only holds the <!--head--> marker.
  - The inline boot script (src/lib/boot-inline.js) is minified and placed first
    in <head>. Its hash goes into the CSP (scripts/prerender.mjs keeps
    vercel.json in sync).
  - Mona Sans gets a <link rel="preload"> with its hashed name; the two poster
    AVIFs are preloaded with media queries (the first paint).
  - three and src/scene/* land in one lazy chunk named "scene" (budget.mjs finds it).
*/

function gitSha() {
  try {
    return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'dev'
  }
}

const BUILD_SHA = process.env.BUILD_SHA || process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || gitSha()
const BUILD_DATE = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10)

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function headTags() {
  const og = HEAD.ogImage
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: HEAD.person.name,
    url: HEAD.canonical,
    jobTitle: HEAD.person.jobTitle,
    homeLocation: { '@type': 'Place', name: HEAD.person.homeLocation },
    affiliation: { '@type': 'CollegeOrUniversity', name: HEAD.person.affiliation },
    sameAs: HEAD.person.sameAs,
    image: og.href,
  }
  const meta = (attr, key, value) => `<meta ${attr}="${key}" content="${esc(value)}" />`
  return [
    `<title>${esc(HEAD.title.text)}</title>`,
    meta('name', 'description', HEAD.description.text),
    meta('name', 'color-scheme', 'dark'),
    meta('name', 'theme-color', HEAD.themeColor),
    `<link rel="canonical" href="${esc(HEAD.canonical)}" />`,
    `<link rel="icon" href="/favicon.svg" type="image/svg+xml" />`,
    `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`,
    `<link rel="preload" as="image" type="image/avif" href="/poster/hero-1440.avif" media="(min-aspect-ratio: 9/10)" fetchpriority="high" />`,
    `<link rel="preload" as="image" type="image/avif" href="/poster/hero-780.avif" media="(max-aspect-ratio: 9/10)" fetchpriority="high" />`,
    meta('property', 'og:type', 'website'),
    meta('property', 'og:url', HEAD.canonical),
    meta('property', 'og:title', HEAD.title.text),
    meta('property', 'og:description', HEAD.description.text),
    meta('property', 'og:site_name', HEAD.siteName.text),
    meta('property', 'og:locale', 'en_US'),
    meta('property', 'og:image', og.href),
    meta('property', 'og:image:width', og.width),
    meta('property', 'og:image:height', og.height),
    meta('property', 'og:image:type', og.type),
    meta('property', 'og:image:alt', og.alt.text),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', HEAD.title.text),
    meta('name', 'twitter:description', HEAD.description.text),
    meta('name', 'twitter:image', og.href),
    meta('name', 'twitter:image:alt', og.alt.text),
    `<script type="application/ld+json">${JSON.stringify(person).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ')
}

function sitePlugin() {
  let boot = ''
  return {
    name: 'ae-site-head',
    async buildStart() {
      const src = readFileSync(new URL('./src/lib/boot-inline.js', import.meta.url), 'utf8')
      const out = await transformWithEsbuild(src, 'boot-inline.js', { minify: true, target: 'es2015' })
      boot = out.code.trim()
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        let preloads = ''
        if (ctx.bundle) {
          const fonts = Object.values(ctx.bundle)
            .map((a) => a.fileName)
            .filter((f) => /\/mona-sans-vf-latin-[\w-]+\.woff2$/.test(f))
            .sort()
          preloads = fonts
            .map((f) => `<link rel="preload" href="/${f}" as="font" type="font/woff2" crossorigin />`)
            .join('\n    ')
        }
        return html
          .replace('<!--boot-->', `<script>${boot}</script>`)
          .replace('<!--head-->', headTags())
          .replace('<!--preload-->', preloads)
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), sitePlugin()],
  define: {
    __BUILD_SHA__: JSON.stringify(BUILD_SHA),
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
  },
  build: {
    manifest: true,
    modulePreload: { polyfill: false },
    // Inline only tiny assets; fonts and the figure always stay files.
    assetsInlineLimit: 2048,
    reportCompressedSize: false,
    // the scene chunk is three plus the scene, about 600 KB minified before gzip; budget.mjs holds the gzip line
    chunkSizeWarningLimit: 720,
    rollupOptions: {
      output: {
        // three rides in the scene chunk, never the entry (DESIGN.md 3.1)
        manualChunks: (id) => (id.includes('node_modules/three') || /\/src\/scene\//.test(id) ? 'scene' : undefined),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
})
