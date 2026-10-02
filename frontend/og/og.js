/*
  OG image: borrow the built poster (see og.html). A separate file, not an
  inline script, because serve-dist applies the site CSP (script-src 'self').
  Asset URLs in the site CSS point at /assets/, which this server serves from
  /dist/assets/. body[data-ready] marks the frame as ready to capture.
*/
try {
  const res = await fetch('/dist/index.html', { cache: 'no-store' })
  if (res.ok) {
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html')
    // The whole NightGrid layer: the poster plus its camera (inline vars),
    // scrims and horizon, so the card frames the map exactly as the hero does
    // on a desktop of this size.
    const grid = doc.querySelector('.ng')
    const css = doc.querySelector('style[data-href]')
    if (grid && grid.querySelector('svg[role="img"]')) {
      if (css) {
        const style = document.createElement('style')
        style.textContent = css.textContent.replaceAll('url(/assets/', 'url(/dist/assets/')
        document.head.insertBefore(style, document.getElementById('og-style'))
      }
      grid.setAttribute('aria-hidden', 'true')
      grid.dataset.focus = 'origin'
      document.getElementById('map').appendChild(document.importNode(grid, true))
      document.body.dataset.map = 'grid'
    }
  }
} catch {
  /* no build: the rings stand in */
}
await document.fonts.ready
document.body.dataset.ready = '1'
