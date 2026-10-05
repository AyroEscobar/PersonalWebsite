/*
  OG image: borrow the built first screen (see og.html). A separate file,
  not an inline script, because serve-dist applies the site CSP
  (script-src 'self'). Asset URLs in the site CSS point at /assets/, which
  this server serves from /dist/assets/. body[data-ready] marks the frame as
  ready to capture; body[data-built] says the build was found.
*/
const html = document.documentElement
try {
  const res = await fetch('/dist/index.html', { cache: 'no-store' })
  if (res.ok) {
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html')
    const css = doc.querySelector('style[data-href]')
    const field = doc.querySelector('.hero-stage > .field')
    const masthead = doc.querySelector('.hero .masthead')
    const sentence = doc.getElementById('sentence')
    if (css && field && masthead && sentence) {
      const style = document.createElement('style')
      style.textContent = css.textContent.replaceAll('url(/assets/', 'url(/dist/assets/')
      document.head.insertBefore(style, document.getElementById('og-style'))
      document.getElementById('field').replaceWith(document.importNode(field, true))
      const copy = document.getElementById('copy')
      copy.prepend(document.importNode(masthead, true), document.importNode(sentence, true))
      document.body.dataset.built = '1'
    }
  }
} catch {
  /* no build: og.mjs fails loudly */
}
await document.fonts.ready
// The same gate as the boot script: a url() backdrop filter that is really honoured.
const lens = !!(window.CSS && CSS.supports('backdrop-filter', 'url(#x)')) && !!navigator.userAgentData
html.dataset.lens = lens ? 'on' : 'off'
try {
  const m = await import('/src/glass/lens.js')
  m.startLens()
  const stand = document.querySelector('#sentence .lens-static')
  const words = stand && m.wordLines(stand.parentElement)
  if (stand && words?.[1]) m.loupeOn(stand, words[1])
} catch {
  /* the lens stays clear glass */
}
await new Promise((r) => setTimeout(r, 700))
document.body.dataset.ready = '1'
