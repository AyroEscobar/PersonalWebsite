/* toast('copied'): show the one toast from anywhere. <ToastRegion /> (src/ui/Toast.jsx) listens. */
export const listeners = new Set()
let seq = 0

export function toast(text) {
  const t = { id: ++seq, text }
  listeners.forEach((fn) => fn(t))
}
