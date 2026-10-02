// Re-export so scripts/build-grid.mjs (A) can call mapshaper's API: (await import('../tools/mapshaper.mjs')).default.runCommands(...)
export { default } from 'mapshaper'
