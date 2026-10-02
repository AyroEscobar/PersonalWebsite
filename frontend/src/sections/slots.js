/*
  Components other builders own that the content sections render
  (PLAN.md 4.7 NowBoard by B). NodeTag (4.4) was dropped in r1 (M10): the
  place names already say where, and the 48 x 20 sprite read as a scribble.

  They are built in parallel, so the sections pick them up when the file
  exists and fall back cleanly when it does not. import.meta.glob with an
  exact path is a static, eager import once the file is there (same chunk,
  same prerender) and an empty object until then.
*/
const boards = import.meta.glob('../chrome/NowBoard.jsx', { eager: true })

export const NowBoard = boards['../chrome/NowBoard.jsx']?.default ?? null
