/*
  Inline boot script. NOT imported by the app. vite.config.js minifies this file and inlines it first
  in <head>, before any CSS; scripts/prerender.mjs hashes the result for the CSP in vercel.json. Keep it
  ES5, tiny, and free of anything that can throw uncaught.

  Writes on <html>, read by CSS and by src/lib/client.js:
    data-theme         'light' (black-figure) or 'dark' (red-figure): ?theme=, then the stored choice
                       (ae.theme), then 'light': the black-figure vase is the picture, so a first visit
                       sees it whatever the system's scheme (dark is one click on the switch). Set
                       before the first stylesheet, so a reload never flashes the other vase.
    data-js            JavaScript is running
    data-motion        'off' when the viewer turned the scene off (ae.motion), else 'on'
    data-tier          'still' under prefers-reduced-motion, motion off, no WebGL2 or ?tier=still;
                       'lite' for Save-Data, 4 GB or less, a coarse pointer or a short side under
                       700 px (?tier=lite); else 'full' (?tier=full forces it)
    data-transparency  'reduced' when the quiet switch is on (ae.quiet, ?quiet=1, or the OS setting):
                       the poster instead of the live scene
    data-ui            '0' for ?ui=0 (the bare frieze, for captures)
    class clock-fixed  ?t= (a fixed clock: instant scrolls for captures)
    class notext       ?notext=1, for the contrast capture in QA

  And in <head>: the theme-color meta for the resolved theme (it comes first, so it wins over the static
  light one), and one <link rel="preload"> for the one poster this visitor will see
  (the theme's, the phone cut under 960 px), so the first paint never fetches the other vase.
*/
;(function () {
  var d = document.documentElement
  var h = document.head
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
  var theme = (q.match(/[?&]theme=(light|dark)(&|$)/) || [])[1] || ls('ae.theme')
  if (theme !== 'light' && theme !== 'dark') theme = 'light'
  d.setAttribute('data-theme', theme)
  try {
    var m = document.createElement('meta')
    m.name = 'theme-color'
    m.content = theme === 'dark' ? '#141110' : '#C47D45'
    h.appendChild(m)
    var l = document.createElement('link')
    l.rel = 'preload'
    l.as = 'image'
    l.type = 'image/avif'
    l.setAttribute('fetchpriority', 'high')
    l.href = '/poster/frieze-' + theme + (mq('(max-width: 959.98px)') ? '-m' : '') + '.avif'
    h.appendChild(l)
  } catch (e) {}
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
