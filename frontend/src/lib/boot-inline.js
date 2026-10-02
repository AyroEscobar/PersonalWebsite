/*
  Inline boot script (PLAN.md 4.0, 4.12, 5). NOT imported by the app.
  vite.config.js minifies this file and inlines it in <head> before any CSS
  paints. scripts/prerender.mjs hashes the result for the CSP in vercel.json.
  Keep it ES5, tiny, and free of anything that can throw uncaught.

  Writes on <html>:
    data-js      JavaScript is running
    data-mode    'quiet' | 'full'
                 ?quiet in the URL wins, then the stored choice (ae.mode), then
                 auto-quiet for reduced motion, Save-Data or deviceMemory < 4
    data-motion  'reduced' when the OS asks for it or quiet mode is on, else 'full'
    data-boot    'run' only on the first load of the home page in a session,
                 with motion on, not quiet, and no #hash deep link. The first-paint sequence
                 keys off html[data-boot="run"].
*/
;(function () {
  var d = document.documentElement
  var reduced = false
  var stored = null
  var mode = 'full'
  try {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch (e) {}
  try {
    stored = window.localStorage.getItem('ae.mode')
  } catch (e) {}
  if (/[?&]quiet(=[^&]*)?(&|$)/.test(window.location.search)) {
    mode = /[?&]quiet=(0|off|false)(&|$)/.test(window.location.search) ? 'full' : 'quiet'
  } else if (stored === 'quiet' || stored === 'full') {
    mode = stored
  } else {
    var c = navigator.connection
    if (reduced || (c && c.saveData) || (navigator.deviceMemory && navigator.deviceMemory < 4)) mode = 'quiet'
  }
  d.setAttribute('data-js', '')
  d.setAttribute('data-mode', mode)
  d.setAttribute('data-motion', reduced || mode === 'quiet' ? 'reduced' : 'full')
  // The first paint belongs to the home page. The 404 stays dark, and a first
  // visit that lands on it does not use up the home page's first paint.
  if (!/^\/(index\.html)?$/.test(window.location.pathname)) return
  var booted = true
  try {
    booted = window.sessionStorage.getItem('ae.booted') === '1'
    window.sessionStorage.setItem('ae.booted', '1')
  } catch (e) {}
  if (!booted && !reduced && mode !== 'quiet' && !window.location.hash) d.setAttribute('data-boot', 'run')
})()
