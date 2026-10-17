/*
  Single-source constants. Change a value here and every page, meta tag and
  check picks it up. The age lives only here (check-content rule 8).
*/

// [identity-age] Ayro asked for his age on the hero (Thu Oct 15, 2026). Birthday unknown: bump it here.
export const AGE = 20

// [ln-linkedin] His real profile (Ayro, Sat Oct 17, 2026). The other slug, on his resume and his email
// signature, is wrong: scripts/check-content.mjs fails the build if it shows up anywhere.
export const LINKEDIN = 'https://www.linkedin.com/in/ayroescobar/'

// [ln-coffee] His Cal.com coffee chat link, beside LinkedIn in his email signature.
export const COFFEE = 'https://cal.com/ayroescobar/coffee'

// [ln-email] Every way to reach him on the site (Ayro, Mon Oct 5, 2026).
export const EMAIL = 'ayro@esvotech.com'

// [ln-github]
export const GITHUB = 'https://github.com/AyroEscobar'

// [prj-personal-website]
export const REPO = 'https://github.com/AyroEscobar/PersonalWebsite'

// [ln-instagram]
export const INSTAGRAM = 'https://www.instagram.com/ayro.afk'

// [ln-viaere]
export const VIAERE = 'https://viaere.com'

// [ln-esvo]
export const ESVO = 'https://esvotech.com'

// Canonical host (questions.md #27 default: www, which is what is served today).
export const CANONICAL = 'https://www.ayroescobar.com/'
export const HOST = 'ayroescobar.com'

// The CC BY credit for the figure mesh (src/assets/figure/LICENSE.txt). Shown in every footer, every tier.
export const FIGURE_CREDIT = {
  model: 'Male base',
  modelHref: 'https://poly.pizza/m/eWGDnQ0jzmH',
  author: 'Артур Мигранов',
  licence: 'CC BY 3.0',
  licenceHref: 'https://creativecommons.org/licenses/by/3.0/',
}

// The three faces (src/assets/fonts, SIL OFL 1.1; frontend/CREDITS.md). Named in every footer and the kit.
export const FONT_CREDIT = {
  licence: 'SIL Open Font License',
  licenceHref: 'https://openfontlicense.org/',
  faces: [
    { name: 'Cinzel', author: 'Natanael Gama, The Cinzel Project Authors', href: 'https://github.com/NDISCOVER/Cinzel' },
    { name: 'EB Garamond', author: 'Georg Duffner, Octavio Pardo', href: 'https://github.com/octaviopardo/EBGaramond12' },
    { name: 'Marcellus SC', author: 'Brian J. Bonislawsky, Astigmatic', href: 'https://fonts.google.com/specimen/Marcellus+SC' },
  ],
}

// localStorage keys (always behind try/catch).
export const STORAGE = {
  theme: 'ae.theme',
  quiet: 'ae.quiet',
  motion: 'ae.motion',
}
