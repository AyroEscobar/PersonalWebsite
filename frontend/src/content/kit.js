import { ui } from './item.js'

/*
  The kit page (/kit, DESIGN.md 5.14): every component in every state over
  the live scene. Labels only; every sample inside the kit renders the real
  content modules, so nothing here is a claim.
*/

export const KIT = {
  title: ui('kit-title', 'kit, Ayro Escobar'),
  word: ui('kit-word', 'the kit'),
  line: ui('kit-line', 'every component on this site, in every state, over the live scene.'),
  back: ui('kit-back', 'back to the site'),
  simulated: ui('kit-simulated', 'simulated'),
  states: {
    rest: ui('kit-state-rest', 'rest'),
    hover: ui('kit-state-hover', 'hover'),
    focus: ui('kit-state-focus', 'focus'),
    press: ui('kit-state-press', 'press'),
    disabled: ui('kit-state-disabled', 'disabled'),
    active: ui('kit-state-active', 'active'),
    entering: ui('kit-state-entering', 'entering'),
    quiet: ui('kit-state-quiet', 'quiet'),
    open: ui('kit-state-open', 'open'),
    closed: ui('kit-state-closed', 'closed'),
    on: ui('kit-state-on', 'on'),
    off: ui('kit-state-off', 'off'),
    copied: ui('kit-state-copied', 'copied'),
    long: ui('kit-state-long', 'long'),
    small: ui('kit-state-small', 'small'),
    focusWithin: ui('kit-state-focus-within', 'focus within'),
    still: ui('kit-state-still', 'still tier'),
    lite: ui('kit-state-lite', 'lite'),
    paused: ui('kit-state-paused', 'paused'),
    posterOnly: ui('kit-state-poster', 'poster only'),
    canvasOn: ui('kit-state-canvas', 'canvas on'),
    lost: ui('kit-state-lost', 'context lost'),
  },
  variants: {
    primary: ui('kit-var-primary', 'primary'),
    glass: ui('kit-var-glass', 'glass'),
  },
  groups: {
    tokens: ui('kit-g-tokens', 'tokens'),
    glass: ui('kit-g-glass', 'glass'),
    buttons: ui('kit-g-buttons', 'buttons'),
    chips: ui('kit-g-chips', 'chips'),
    card: ui('kit-g-card', 'card'),
    experience: ui('kit-g-experience', 'experience list'),
    nav: ui('kit-g-nav', 'nav pill'),
    contact: ui('kit-g-contact', 'copy email and link row'),
    controls: ui('kit-g-controls', 'scene controls'),
    stage: ui('kit-g-stage', 'stage'),
    chrome: ui('kit-g-chrome', 'footer, skip link, 404'),
  },
  tokens: {
    color: ui('kit-tok-color', 'colour'),
    type: ui('kit-tok-type', 'type'),
    radius: ui('kit-tok-radius', 'radius'),
    space: ui('kit-tok-space', 'space'),
    elevation: ui('kit-tok-elevation', 'elevation'),
    sceneOnly: ui('kit-tok-scene-only', 'scene only'),
    sceneRim: ui('kit-tok-scene-rim', 'scene and rim only'),
    onVoid: ui('kit-tok-on-void', 'on void'),
  },
  glass: {
    thick: ui('kit-glass-thick', 'thick panel'),
    clear: ui('kit-glass-clear', 'clear pill'),
    noblur: ui('kit-fb-noblur', 'no backdrop-filter'),
    reduced: ui('kit-fb-reduced', 'reduced transparency, or the quiet switch'),
    contrast: ui('kit-fb-contrast', 'more contrast'),
    forced: ui('kit-fb-forced', 'forced colours'),
    lite: ui('kit-fb-lite', 'tier lite'),
  },
  nav: {
    desktop: ui('kit-nav-desktop', 'desktop pill'),
    phone: ui('kit-nav-phone', 'phone button and sheet'),
    switchOff: ui('kit-nav-switch-off', 'quiet switch off'),
    switchOn: ui('kit-nav-switch-on', 'quiet switch on'),
  },
  stage: {
    note: ui('kit-stage-note', 'the poster paints first; the canvas fades in over it on its first frame'),
  },
  chrome: {
    skip: ui('kit-chrome-skip', 'skip link, forced visible'),
    footer: ui('kit-chrome-footer', 'footer'),
    notFound: ui('kit-chrome-404', 'the 404'),
  },
}
