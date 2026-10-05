/*
  Formatting helpers. Every range uses the word "to", never a dash.

    dateShort('2026-10-02')         'Oct 2, 2026'
    kb(188416)                      '184 KB'
    secs(612)                       '0.6 s'
*/

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const parts = (iso) => {
  const [y, m = '1', d = '1'] = String(iso).split('-')
  return { y: Number(y), m: Number(m), d: Number(d) }
}

export const dateShort = (iso) => {
  const { y, m, d } = parts(iso)
  return `${SHORT[m - 1]} ${d}, ${y}`
}

export const kb = (bytes) => `${Math.max(1, Math.round(bytes / 1024))} KB`
export const secs = (ms) => `${(ms / 1000).toFixed(1)} s`
