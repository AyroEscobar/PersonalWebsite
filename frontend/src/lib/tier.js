/*
  Render tiers (DESIGN.md 4.4.6): full and lite. The inline boot script
  decides (4 cores or fewer, 4 GB or less, or Save-Data is lite) and writes
  html[data-tier]; CSS reads it directly. Lite gets less blur, no saturate,
  no lens map, no field drift, and a cross-fade instead of the morph.
*/
export function detectTier() {
  if (typeof document === 'undefined') return 'full'
  return document.documentElement.dataset.tier === 'lite' ? 'lite' : 'full'
}
