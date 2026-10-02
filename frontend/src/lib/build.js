/* global __BUILD_SHA__, __BUILD_DATE__ */
/*
  Build stamp values, injected by Vite `define` (vite.config.js) from the
  build environment: the short commit SHA and the UTC build date (YYYY-MM-DD).
  Identical in the client and the prerender, so hydration matches.
*/
export const BUILD_SHA = typeof __BUILD_SHA__ !== 'undefined' ? __BUILD_SHA__ : 'dev'
export const BUILD_DATE = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '1970-01-01'
