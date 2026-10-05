/*
  Single-source constants. Owned by FOUNDATION.
  Change a value here and every page, meta tag and check picks it up.
*/

// [identity-age] The only place the age lives. Birthday unknown (questions.md #17).
export const AGE = 'twenty'

// [ln-linkedin] questions.md #3 default. If /in/ayro-escobar turns out to be the live one, change it here.
export const LINKEDIN = 'https://www.linkedin.com/in/ayroescobar'

// [ln-email]
export const EMAIL = 'ayro.escobar@gmail.com'

// [ln-github]
export const GITHUB = 'https://github.com/AyroEscobar'

// [prj-personal-website]
export const REPO = 'https://github.com/AyroEscobar/PersonalWebsite'

// [ln-instagram]
export const INSTAGRAM = 'https://www.instagram.com/ayro.afk'

// [ln-viaere]
export const VIAERE = 'https://viaere.com'

// [ln-interview-lens]
export const INTERVIEW_LENS = 'https://interview-lens.com'

// Canonical host (questions.md #27 default: www, which is what is served today).
export const CANONICAL = 'https://www.ayroescobar.com/'
export const HOST = 'ayroescobar.com'

// The day the now section was last checked against facts.json. After
// STALE_AFTER_DAYS the now list says "last updated" instead of "updated".
export const NOW_UPDATED = '2026-10-01'
export const STALE_AFTER_DAYS = 45

// localStorage and sessionStorage keys (always behind try/catch).
export const STORAGE = {
  quiet: 'ae.quiet',
  lens: 'ae.lens',
}
