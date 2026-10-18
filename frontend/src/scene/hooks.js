/*
  Hooks for the tools, never for the page: window.__ready (set by frieze.js on the first frame),
  __stats, __bench(n), __frameAt(t), __measure(), __bounds() and __poster(opts). QA, the poster script
  and the framing checks read them; nothing in the site calls them.

    __bench(n)     n frames back to back with a GPU sync after each: { avgMs, size, draws, tris, programs }
    __frameAt(t)   render the frame at clock t (the slip state as it is)
    __measure()    the composition box in metres from the foot point (comp.js BOX is written from it)
    __gait(n)      one push cycle at n samples: the lowest swing knee over the slope, the flattest rear shin
                   (degrees to the slope, while that knee is under 0.45 m), the closest the balls come while
                   both are planted; QA holds the floors (no kneel, no stacked feet)
    __legs(n)      the joints of both legs per sample, relative to his root, for a gait sheet
    __bounds()     CSS px boxes in the viewport: figure (his skinned mesh), disk, room, canvas, and the
                   header, plate and button boxes on screen, so a check can assert none touches him
    __poster(o)    the transparent poster frame as a PNG data URL (frieze.js poster(), for scripts/poster.mjs)
*/
import * as THREE from 'three'

const KEYS = ['__frameAt', '__bench', '__bounds', '__measure', '__poster', '__ready', '__stats', '__gait', '__legs']

export function installHooks(ctx) {
  const { r, cam, scene, f, R, canvas, render, step, measure, poster } = ctx
  const v = new THREE.Vector3(), c = new THREE.Vector3()
  window.__frameAt = (tt) => { render(tt); return { t: tt } }
  window.__bench = (n = 60) => {
    const gl = r.getContext(), px = new Uint8Array(4), fin = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
    fin()
    const s0 = performance.now()
    for (let i = 0; i < n; i++) { step(1 / 60); fin() }
    const size = r.getDrawingBufferSize(new THREE.Vector2())
    return { avgMs: (performance.now() - s0) / n, size: [size.x, size.y], dpr: r.getPixelRatio(), draws: r.info.render.calls, tris: r.info.render.triangles, programs: r.info.programs.length }
  }
  window.__measure = () => measure()
  window.__legs = (n = 24, t0 = 2.34) => {
    const rows = []
    for (let i = 0; i < n; i++) {
      const tt = t0 + (i / n) * f.T
      const o = f.update(tt, { shift: 0, leanAdd: 0, crouch: 0, reachAdd: 0 })
      const r2 = (p) => [+(p.x - o.x).toFixed(3), +p.y.toFixed(3)]
      rows.push({ t: +tt.toFixed(3), ph: +f.phase(tt).toFixed(3), L: [r2(o.kneeL.hip), r2(o.kneeL.knee), r2(o.kneeL.ankle), r2(o.balls[0]), o.kneeL.stance ? 1 : 0, +o.kneeL.u.toFixed(2)], R: [r2(o.kneeR.hip), r2(o.kneeR.knee), r2(o.kneeR.ankle), r2(o.balls[1]), o.kneeR.stance ? 1 : 0, +o.kneeR.u.toFixed(2)] })
    }
    render(t0)
    return rows
  }
  window.__gait = (n = 100) => {
    const r0 = { kneeMin: 9, kneeAt: 0, shinMin: 90, shinAt: 0, sepMin: 9, sepAt: 0, swingKneeMin: 9 }
    const t0 = 4
    for (let i = 0; i < n; i++) {
      const tt = t0 + (i / n) * f.T
      const o = f.update(tt, { shift: 0, leanAdd: 0, crouch: 0, reachAdd: 0 })
      const legs = [o.kneeL, o.kneeR]
      const rear = legs[0].ankle.x < legs[1].ankle.x ? 0 : 1
      legs.forEach((k, j) => {
        if (k.knee.y < r0.kneeMin) { r0.kneeMin = k.knee.y; r0.kneeAt = tt }
        if (!k.stance) r0.swingKneeMin = Math.min(r0.swingKneeMin, k.knee.y)
        const sh = THREE.MathUtils.radToDeg(Math.atan2(Math.abs(k.knee.y - k.ankle.y), Math.abs(k.knee.x - k.ankle.x)))
        if (j === rear && k.knee.y < 0.45 && sh < r0.shinMin) { r0.shinMin = sh; r0.shinAt = tt }
      })
      if (o.stance[0] && o.stance[1]) { const d = Math.abs(o.balls[0].x - o.balls[1].x); if (d < r0.sepMin) { r0.sepMin = d; r0.sepAt = tt } }
    }
    for (const k in r0) r0[k] = +r0[k].toFixed(3)
    return r0
  }
  window.__poster = (o) => poster(o)
  window.__bounds = () => {
    const cr = canvas.getBoundingClientRect()
    const toPx = (p) => { p.project(cam); return [cr.left + (p.x * 0.5 + 0.5) * cr.width, cr.top + (-p.y * 0.5 + 0.5) * cr.height] }
    scene.updateMatrixWorld(true)
    const pos = f.mesh.geometry.attributes.position
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9
    for (let k = 0; k < pos.count; k += 2) {
      v.fromBufferAttribute(pos, k); f.mesh.applyBoneTransform(k, v); v.applyMatrix4(f.mesh.matrixWorld)
      const [sx, sy] = toPx(v)
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy)
    }
    const figure = { x0: Math.round(x0), y0: Math.round(y0), x1: Math.round(x1), y1: Math.round(y1) }
    f.boulder.getWorldPosition(c)
    const [cx, cy] = toPx(c.clone())
    const edge = new THREE.Vector3(c.x + R * 1.035, c.y, c.z)
    const [ex] = toPx(edge)
    const rr = Math.abs(ex - cx)
    const disk = { x0: Math.round(cx - rr), y0: Math.round(cy - rr), x1: Math.round(cx + rr), y1: Math.round(cy + rr) }
    const box = (el) => { const b = el.getBoundingClientRect(); return { x0: Math.round(b.left), y0: Math.round(b.top), x1: Math.round(b.right), y1: Math.round(b.bottom) } }
    const shown = (el) => { const cs = getComputedStyle(el); const b = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && b.width > 0 && b.height > 0 && b.bottom > 0 && b.top < innerHeight }
    const host = ctx.host()
    const panels = [...document.querySelectorAll('.neck, .plate, .btn')].filter(shown).map((el) => ({ kind: el.classList.contains('neck') ? 'header' : el.classList.contains('plate') ? 'plate' : 'button', ...box(el) }))
    return { figure, disk, room: host ? box(host.room) : null, canvas: box(canvas), host: host?.kind ?? null, panels, view: [innerWidth, innerHeight], dpr: r.getPixelRatio() }
  }
}

export function removeHooks() {
  for (const k of KEYS) {
    try { delete window[k] } catch { window[k] = undefined }
  }
}
