// Tiny pub/sub for sharing the Web Audio AnalyserNode across components.
// MusicPlayer creates the analyser on first user interaction and publishes it here;
// any visualizer (e.g. AudioWave on the About section) subscribes to read frequency data.

const listeners = new Set()
let analyser = null

export function setAnalyser(node) {
  analyser = node
  for (const fn of listeners) fn(node)
}

export function getAnalyser() {
  return analyser
}

export function subscribe(fn) {
  listeners.add(fn)
  if (analyser) fn(analyser)
  return () => listeners.delete(fn)
}
