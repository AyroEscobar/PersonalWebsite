/*
  Per-vertex convexity on the bind pose, computed once on the CPU (no asset bytes): for each vertex, the
  mean over its edge neighbours of -2 dot(n_i, p_j - p_i) / |p_j - p_i|^2, in 1/metre (a sphere of radius
  r gives +1/r; a crease gives a large negative value), then smoothed. Written as the attribute aCurv.
  The materials read it for cavities (marble grime, bronze patina), worn high points (polished bronze),
  thin parts (marble translucency) and incised creases (the vase look).
    addCurvature(geometry, { metres = 1, smooth = 2 })   ~6 ms for the 8.8k-vertex figure on an M5 Pro
*/
import * as THREE from 'three'

export function addCurvature(geo, { metres = 1, smooth = 2 } = {}) {
  const pos = geo.attributes.position, nor = geo.attributes.normal, n = pos.count
  const idx = geo.index ? geo.index.array : null
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    P[i * 3] = pos.getX(i) * metres; P[i * 3 + 1] = pos.getY(i) * metres; P[i * 3 + 2] = pos.getZ(i) * metres
    const x = nor.getX(i), y = nor.getY(i), z = nor.getZ(i), l = Math.hypot(x, y, z) || 1
    N[i * 3] = x / l; N[i * 3 + 1] = y / l; N[i * 3 + 2] = z / l
  }
  const sum = new Float32Array(n), cnt = new Float32Array(n)
  const tri = idx ? idx.length / 3 : n / 3
  const edge = (a, b) => {
    const dx = P[b * 3] - P[a * 3], dy = P[b * 3 + 1] - P[a * 3 + 1], dz = P[b * 3 + 2] - P[a * 3 + 2]
    const d2 = dx * dx + dy * dy + dz * dz
    if (d2 < 1e-12) return
    sum[a] += -2 * (N[a * 3] * dx + N[a * 3 + 1] * dy + N[a * 3 + 2] * dz) / d2; cnt[a]++
    sum[b] += -2 * (-(N[b * 3] * dx + N[b * 3 + 1] * dy + N[b * 3 + 2] * dz)) / d2; cnt[b]++
  }
  // neighbour lists for the smoothing pass
  const nb = Array.from({ length: n }, () => [])
  for (let t = 0; t < tri; t++) {
    const a = idx ? idx[t * 3] : t * 3, b = idx ? idx[t * 3 + 1] : t * 3 + 1, c = idx ? idx[t * 3 + 2] : t * 3 + 2
    edge(a, b); edge(b, c); edge(c, a)
    nb[a].push(b, c); nb[b].push(a, c); nb[c].push(a, b)
  }
  let k = new Float32Array(n)
  for (let i = 0; i < n; i++) k[i] = cnt[i] ? sum[i] / cnt[i] : 0
  for (let s = 0; s < smooth; s++) {
    const o = new Float32Array(n)
    for (let i = 0; i < n; i++) { let a = k[i] * 2, w = 2; for (const j of nb[i]) { a += k[j]; w++ } o[i] = a / w }
    k = o
  }
  geo.setAttribute('aCurv', new THREE.BufferAttribute(k, 1))
  return k
}
