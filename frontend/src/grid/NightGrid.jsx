/*
  PLACEHOLDER by FOUNDATION. Owned by A (PLAN.md 4.1). Replace this file.

  Contract: default export NightGrid, no props. Rendered first inside <main>.
  Reads store.focus for the camera, store.tier for the canvas, and mounts
  GridCanvas through ui/DeferredMount with tiers={['full', 'lite']}.
  Labels come from content/places.js (NODES, MAP); only ALLOWED_MAP_LABELS
  may appear on the map.
*/
export default function NightGrid() {
  return <div data-slot="NightGrid" aria-hidden="true" className="deco" />
}
