import { ui } from './item.js'

/*
  The kit page (/kit, DESIGN.md 5.15): every component in every state on
  one page. Labels only; every sample inside the kit renders the real
  content modules, so nothing here is a claim.
*/

export const KIT = {
  title: ui('kit-title', 'kit, Ayro Escobar'),
  word: ui('kit-word', 'the kit'),
  line: ui('kit-line', 'every component on this site, in every state, over the same light.'),
  back: ui('kit-back', 'back to the site'),
  simulated: ui('kit-simulated', 'simulated'),
  states: {
    rest: ui('kit-state-rest', 'rest'),
    hover: ui('kit-state-hover', 'hover'),
    focus: ui('kit-state-focus', 'focus-visible'),
    active: ui('kit-state-active', 'active'),
    disabled: ui('kit-state-disabled', 'disabled'),
    loading: ui('kit-state-loading', 'loading'),
    pressed: ui('kit-state-pressed', 'pressed'),
    current: ui('kit-state-current', 'current'),
    spill: ui('kit-state-spill', 'press spills into the neighbour'),
    open: ui('kit-state-open', 'open'),
    shown: ui('kit-state-shown', 'shown'),
  },
  variants: {
    primary: ui('kit-var-primary', 'primary'),
    glass: ui('kit-var-glass', 'glass'),
    ghost: ui('kit-var-ghost', 'ghost'),
  },
  groups: {
    material: ui('kit-g-material', 'the material'),
    nav: ui('kit-g-nav', 'lens nav'),
    masthead: ui('kit-g-masthead', 'masthead and the quiet switch'),
    buttons: ui('kit-g-buttons', 'buttons'),
    chips: ui('kit-g-chips', 'chips'),
    card: ui('kit-g-card', 'card'),
    now: ui('kit-g-now', 'now list'),
    plate: ui('kit-g-plate', 'timeline plate'),
    receipt: ui('kit-g-receipt', 'receipts'),
    linkrow: ui('kit-g-linkrow', 'link row'),
    tooltip: ui('kit-g-tooltip', 'tooltip'),
    toast: ui('kit-g-toast', 'toast'),
    head: ui('kit-g-head', 'section head'),
    contact: ui('kit-g-contact', 'contact card'),
    footer: ui('kit-g-footer', 'footer'),
    fallbacks: ui('kit-g-fallbacks', 'fallbacks'),
    tokens: ui('kit-g-tokens', 'tokens'),
  },
  material: {
    clear: ui('kit-mat-clear', 'clear: the lens and the card ruler'),
    thick: ui('kit-mat-thick', 'thick: buttons, the contact card, the toast'),
    sheet: ui('kit-mat-sheet', 'sheet: every content surface'),
    bar: ui('kit-mat-bar', 'bar: the nav once it is a pill'),
  },
  nav: {
    lens: ui('kit-nav-lens', 'lens: reading the sentence'),
    pill: ui('kit-nav-pill', 'pill: wide screens, after the morph'),
    dock: ui('kit-nav-dock', 'dock: phones'),
    states: ui('kit-nav-states', 'words: hover on now, focus on work, press on builds'),
  },
  chips: {
    status: ui('kit-chips-status', 'status: a hairline enters from the left'),
    plain: ui('kit-chips-plain', 'plain: dates, counts, places'),
  },
  card: {
    glass: ui('kit-card-glass', 'glass sheet, the one the page uses'),
    base: ui('kit-card-base', 'base card, kept only to show what is not used'),
    focus: ui('kit-card-focus', 'focus inside: the card takes the hover look'),
  },
  linkrow: {
    legend: ui('kit-linkrow-legend', 'github shows hover, linkedin shows focus, instagram shows press.'),
  },
  fallbacks: {
    noblur: ui('kit-fb-noblur', 'no backdrop-filter'),
    reduced: ui('kit-fb-reduced', 'reduced transparency, or the quiet switch'),
    contrast: ui('kit-fb-contrast', 'more contrast'),
    forced: ui('kit-fb-forced', 'forced colours'),
  },
  tokens: {
    color: ui('kit-tok-color', 'colour'),
    field: ui('kit-tok-field', 'the field'),
    type: ui('kit-tok-type', 'type'),
    radius: ui('kit-tok-radius', 'radius'),
    space: ui('kit-tok-space', 'space'),
    serifSample: ui('kit-tok-serif', 'his voice, in Instrument Serif italic'),
    sansSample: ui('kit-tok-sans', 'Names, numbers and UI, in Inter'),
  },
  sample: {
    button: ui('kit-sample-button', 'open github'),
    buttonBusy: ui('kit-sample-button-busy', 'opening github'),
    ghost: ui('kit-sample-ghost', 'open linkedin'),
    ghostBusy: ui('kit-sample-ghost-busy', 'opening linkedin'),
    work: ui('kit-sample-work', 'see the work'),
  },
}
