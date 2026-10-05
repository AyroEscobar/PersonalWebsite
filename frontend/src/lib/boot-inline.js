/*
  Inline boot script (DESIGN.md 3.10, 4.5). NOT imported by the app.
  vite.config.js minifies this file and inlines it in <head> before any CSS
  paints; scripts/prerender.mjs hashes the result for the CSP in vercel.json.
  Keep it ES5, tiny, and free of anything that can throw uncaught.

  Writes on <html>, read by CSS and by src/lib/client.js:
    data-js            JavaScript is running
    data-motion        'off' when the viewer turned the scene off (ae.motion), else 'on'
    data-tier          'still' under prefers-reduced-motion, motion off, no WebGL2 or ?tier=still;
                       'lite' for Save-Data, 4 GB or less, a coarse pointer or a short side under
                       700 px (?tier=lite); else 'full' (?tier=full forces it)
    data-transparency  'reduced' when the quiet switch is on (ae.quiet, ?quiet=1, or the OS setting)
    data-ui            '0' for ?ui=0 (the bare scene, for posters)
    class clock-fixed  ?t= (a fixed clock: instant scrolls for captures)
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
  function ls(k) {
    try {
      return window.localStorage.getItem(k)
    } catch (e) {
      return null
    }
  }
  var motionOff = ls('ae.motion') === 'off'
  var reduced = mq('(prefers-reduced-motion: reduce)') || has(/[?&]motion=reduced(&|$)/)
  var forced = (q.match(/[?&]tier=(full|lite|still)(&|$)/) || [])[1]
  var gl = null
  if (!forced && !reduced && !motionOff) {
    try {
      gl = document.createElement('canvas').getContext('webgl2')
      if (gl) {
        var ext = gl.getExtension('WEBGL_lose_context')
        if (ext) ext.loseContext()
      }
    } catch (e) {
      gl = null
    }
  }
  var tier = forced
  if (!tier) {
    if (reduced || motionOff || !gl) tier = 'still'
    else if ((c && c.saveData) || (n.deviceMemory && n.deviceMemory <= 4) || mq('(pointer: coarse)') || Math.min(window.innerWidth, window.innerHeight) < 700) tier = 'lite'
    else tier = 'full'
  }
  var quiet = false
  if (has(/[?&]quiet=/)) quiet = has(/[?&]quiet=(1|on|true)(&|$)/)
  else quiet = ls('ae.quiet') === '1' || mq('(prefers-reduced-transparency: reduce)')
  d.setAttribute('data-js', '')
  d.setAttribute('data-motion', motionOff ? 'off' : 'on')
  d.setAttribute('data-tier', tier)
  d.setAttribute('data-transparency', quiet ? 'reduced' : 'full')
  if (has(/[?&]ui=0(&|$)/)) d.setAttribute('data-ui', '0')
  if (has(/[?&]t=/)) d.className += ' clock-fixed'
  if (has(/[?&]notext=1(&|$)/)) d.className += ' notext'
})()
