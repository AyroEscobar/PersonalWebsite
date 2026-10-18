import { ui } from './item.js'

/*
  The kit page (/kit): every component in every state, with the production CSS. Labels only; every
  sample inside the kit renders the real content modules, so nothing here is a claim.
*/

export const KIT = {
  title: ui('kit-title', 'kit, Ayro Escobar'),
  word: ui('kit-word', 'the kit'),
  line: ui('kit-line', 'every component on this site, in every state, on the vase.'),
  back: ui('kit-back', 'back to the site'),
  simulated: ui('kit-simulated', 'simulated'),
  states: {
    rest: ui('kit-state-rest', 'rest'),
    hover: ui('kit-state-hover', 'hover'),
    focus: ui('kit-state-focus', 'focus'),
    press: ui('kit-state-press', 'press'),
    disabled: ui('kit-state-disabled', 'disabled'),
    active: ui('kit-state-active', 'active'),
    quiet: ui('kit-state-quiet', 'quiet'),
    open: ui('kit-state-open', 'open'),
    closed: ui('kit-state-closed', 'closed'),
    on: ui('kit-state-on', 'on'),
    off: ui('kit-state-off', 'off'),
    copied: ui('kit-state-copied', 'copied'),
    small: ui('kit-state-small', 'small'),
    focusWithin: ui('kit-state-focus-within', 'focus within, the arrow out'),
    still: ui('kit-state-still', 'still tier'),
    paused: ui('kit-state-paused', 'paused'),
    posterOnly: ui('kit-state-poster', 'poster only'),
    canvasOn: ui('kit-state-canvas', 'canvas on stage'),
    light: ui('kit-state-light', 'light, black-figure'),
    dark: ui('kit-state-dark', 'dark, red-figure'),
  },
  variants: {
    fill: ui('kit-var-fill', 'fill'),
    line: ui('kit-var-line', 'line'),
  },
  groups: {
    tokens: ui('kit-g-tokens', 'tokens'),
    plates: ui('kit-g-plates', 'plates'),
    buttons: ui('kit-g-buttons', 'buttons'),
    card: ui('kit-g-card', 'card'),
    experience: ui('kit-g-experience', 'experience list'),
    nav: ui('kit-g-nav', 'the neck'),
    ornament: ui('kit-g-ornament', 'ornament'),
    contact: ui('kit-g-contact', 'copy email and link row'),
    controls: ui('kit-g-controls', 'scene controls'),
    stage: ui('kit-g-stage', 'stage'),
    chrome: ui('kit-g-chrome', 'footer, skip link, 404'),
  },
  tokens: {
    color: ui('kit-tok-color', 'palette'),
    type: ui('kit-tok-type', 'type'),
    sceneOnly: ui('kit-tok-scene-only', 'scene and poster only, never text'),
  },
  plates: {
    plate: ui('kit-plate', 'the hero plate'),
    panel: ui('kit-panel', 'a work plate'),
    quiet: ui('kit-fb-quiet', 'quiet: the poster instead of the live scene'),
    contrast: ui('kit-fb-contrast', 'more contrast'),
    forced: ui('kit-fb-forced', 'forced colours'),
  },
  nav: {
    desktop: ui('kit-nav-desktop', 'the neck on the clay, with the tongue band'),
    scrolled: ui('kit-nav-scrolled', 'the neck after 80 px of scroll'),
    phone: ui('kit-nav-phone', 'phone menu'),
    themeLight: ui('kit-nav-theme-light', 'theme switch, light'),
    themeDark: ui('kit-nav-theme-dark', 'theme switch, dark'),
    switchOff: ui('kit-nav-switch-off', 'quiet off'),
    switchOn: ui('kit-nav-switch-on', 'quiet on'),
  },
  ornament: {
    meander: ui('kit-orn-meander', 'the meander, the frieze and foot edges'),
    tongues: ui('kit-orn-tongues', 'the tongue band, under the neck'),
    rays: ui('kit-orn-rays', 'the ray band, the top edge of the lower frieze'),
    numerals: ui('kit-orn-numerals', 'section numerals'),
    ground: ui('kit-orn-ground', 'the ground line, the painter’s double rule'),
  },
  stage: {
    note: ui('kit-stage-note', 'the poster paints first; the canvas fades in over it on its first frame'),
  },
  chrome: {
    skip: ui('kit-chrome-skip', 'skip link, forced visible'),
    footer: ui('kit-chrome-footer', 'footer'),
    notFound: ui('kit-chrome-404', 'the 404'),
    closer: ui('kit-closer', 'the closer, once on the site'),
  },
}
