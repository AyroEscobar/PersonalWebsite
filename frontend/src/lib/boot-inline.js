/*
  Inline boot script (DESIGN.md 4.3, 4.4). NOT imported by the app.
  vite.config.js minifies this file and inlines it in <head> before any CSS
  paints; scripts/prerender.mjs hashes the result for the CSP in vercel.json.
  Keep it ES5, tiny, and free of anything that can throw uncaught.

  Writes on <html>, read by CSS and by src/lib/client.js:
    data-js            JavaScript is running
    data-motion        'reduced' for the OS setting or ?motion=reduced, else 'full'
    data-tier          'lite' for 4 cores or fewer, 4 GB or less, or Save-Data
                       (?tier=lite or ?tier=full force it), else 'full'
    data-lens          'on' only where a url() backdrop filter is honoured. @supports
                       alone is not trusted (Safari parses url() and ignores it), so
                       the gate also needs a Chromium-only API. ?lens=off turns it off.
    data-transparency  'reduced' when the quiet switch is on (ae.quiet, or ?quiet=1)
    data-mode          'split' (the nav is its own pill from the start) under reduced
                       motion or tier lite, else 'morph' (the lens becomes the nav)
    class notext       ?notext=1, for the contrast capture in QA
*/
;(function () {
  var d = document.documentElement
  var q = window.location.search
  var n = navigator
  var c = n.connection
  function has(re) {
    return re.test(q)
  }
  function mq(s) {
    try {
      return window.matchMedia(s).matches
    } catch (e) {
      return false
    }
  }
  var reduced = mq('(prefers-reduced-motion: reduce)') || has(/[?&]motion=reduced(&|$)/)
  var lite =
    has(/[?&]tier=lite(&|$)/) ||
    (!has(/[?&]tier=full(&|$)/) &&
      !!((n.hardwareConcurrency && n.hardwareConcurrency <= 4) || (c && c.saveData) || (n.deviceMemory && n.deviceMemory <= 4)))
  var quiet = false
  if (has(/[?&]quiet=/)) quiet = has(/[?&]quiet=(1|on|true)(&|$)/)
  else {
    try {
      quiet = window.localStorage.getItem('ae.quiet') === '1'
    } catch (e) {}
  }
  var lens = false
  try {
    lens = !lite && !has(/[?&]lens=off(&|$)/) && !!(window.CSS && CSS.supports('backdrop-filter', 'url(#x)')) && !!n.userAgentData
  } catch (e) {}
  d.setAttribute('data-js', '')
  d.setAttribute('data-motion', reduced ? 'reduced' : 'full')
  d.setAttribute('data-tier', lite ? 'lite' : 'full')
  d.setAttribute('data-lens', lens ? 'on' : 'off')
  d.setAttribute('data-transparency', quiet ? 'reduced' : 'full')
  d.setAttribute('data-mode', reduced || lite ? 'split' : 'morph')
  if (has(/[?&]notext=1(&|$)/)) d.className += ' notext'
})()
