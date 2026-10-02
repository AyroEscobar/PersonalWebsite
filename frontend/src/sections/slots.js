/*
  Components other builders own that the content sections render
  (PLAN.md 4.4 NodeTag by A, 4.7 NowBoard by B).

  They are built in parallel, so the sections pick them up when the file
  exists and fall back cleanly when it does not. import.meta.glob with an
  exact path is a static, eager import once the file is there (same chunk,
  same prerender) and an empty object until then.
*/
const tags = import.meta.glob('../grid/NodeTag.jsx', { eager: true })
const boards = import.meta.glob('../chrome/NowBoard.jsx', { eager: true })

export const NodeTag = tags['../grid/NodeTag.jsx']?.default ?? null
export const NowBoard = boards['../chrome/NowBoard.jsx']?.default ?? null
