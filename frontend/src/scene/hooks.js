/*
  Hooks for the tools, never for the page (DESIGN.md 3.12): window.__ready, __stats, __bench(n),
  __frameAt(t, p), __bounds(), __feet(), __hands(), __prog(), __CAM, __LIGHT, __objs. The query flags
  (?t ?p ?tier ?slip ?ui) are read in boulder.js.
*/
import * as THREE from 'three'
import { hazeT } from './world.js'
import { rockRadius } from './rock.js'

export function readQuery() {
  const q = new URLSearchParams(location.search)
  return {
    fixedT: q.has('t') ? Number(q.get('t')) : null,
    forcedP: q.has('p') ? Number(q.get('p')) : null,
    forcedSlip: q.has('slip') ? Number(q.get('slip')) : null,
  }
}

export function installHooks(ctx) {
  const { r, cam, canvas, slope, fig, city, R, tier, render, state, objs, CAM, LIGHT, CITY } = ctx
  const proj = new THREE.Vector3(), box = new THREE.Box3()
  window.__CAM = CAM; window.__LIGHT = LIGHT; window.__CITY = CITY
  window.__prog = () => ({ prog: state.prog(), target: state.target(), vel: state.vel() })
  window.__objs = objs
  window.__frameAt = (tt, p) => {
    if (p !== undefined && p !== null) state.force(p)
    const d = tt - state.t()
    state.advance(d)
    render(tt, 1 / 60)
    return { t: tt, tau: state.tau(), rate: state.rate(), slip: state.slipping() }
  }
  window.__bench = (n = 60, step = 1 / 60) => {
    const gl = r.getContext(), px = new Uint8Array(4)
    const fin = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
    fin(); const t0 = performance.now(); let tt = state.t()
    for (let i = 0; i < n; i++) { tt += step; state.advance(step); render(tt, step); fin() }
    return { avgMs: (performance.now() - t0) / n, dpr: r.getPixelRatio(), size: [canvas.width, canvas.height], tier }
  }
  // screen-space boxes (CSS px) of the figure, the rock and the city, for framing checks
  const toScreen = (pts) => {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, n = 0
    for (const p of pts) {
      proj.copy(p).applyMatrix4(cam.matrixWorldInverse); if (proj.z > -cam.near) continue // behind the camera
      proj.copy(p).project(cam); const sx = (proj.x * 0.5 + 0.5) * innerWidth, sy = (-proj.y * 0.5 + 0.5) * innerHeight
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy); n++
    }
    return n ? { x0: Math.round(x0), y0: Math.round(y0), x1: Math.round(x1), y1: Math.round(y1) } : null
  }
  window.__bounds = () => {
    const out = {}
    const B = state.B()
    ctx.scene.updateMatrixWorld(); const o0 = fig.update(state.tau(), state.pose()); ctx.scene.updateMatrixWorld(); fig.mesh.skeleton.update(); fig.mesh.computeBoundingBox()
    box.copy(fig.mesh.boundingBox)
    const fp = []
    for (let i = 0; i < 8; i++) fp.push(new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).applyMatrix4(fig.mesh.matrixWorld))
    out.figure = toScreen(fp)
    const jp = []
    for (const k in fig.Pw) jp.push(fig.Pw[k].clone().applyMatrix4(slope.matrixWorld))
    for (const b of o0.balls) jp.push(b.clone().applyMatrix4(slope.matrixWorld))
    out.joints = toScreen(jp)
    out.feet = toScreen(o0.balls.map((b) => b.clone().applyMatrix4(slope.matrixWorld)))
    const bp = []
    for (let i = 0; i < 400; i++) { const u = Math.acos(1 - 2 * (i + 0.5) / 400), v = i * 2.39996; bp.push(new THREE.Vector3(Math.sin(u) * Math.cos(v), Math.cos(u), Math.sin(u) * Math.sin(v)).multiplyScalar(R * 1.035).add(B)) }
    out.boulder = toScreen(bp)
    // the city box counts only the lights the camera can see: through the valley haze (transmittance
    // over 0.2, the same formula as the shader) and with no mountain in the way (a ray from the camera
    // to each sampled point must not hit the slope first)
    const cp = city.userData.points.geometry.attributes.position, cpts = []
    const ray = new THREE.Raycaster(), dir = new THREE.Vector3()
    const ground = slope.children.find((o) => o.isMesh && o.geometry?.attributes?.position?.count > 10000)
    for (let i = 0; i < cp.count; i += 7) {
      const p = new THREE.Vector3().fromBufferAttribute(cp, i).applyMatrix4(city.userData.points.matrixWorld)
      if (hazeT(city.userData.haze(), cam.position, p) < 0.2) continue
      dir.copy(p).sub(cam.position); const dist = dir.length(); dir.normalize()
      ray.set(cam.position, dir); ray.far = dist
      if (ground && ray.intersectObject(ground, false).length) continue
      cpts.push(p)
    }
    out.city = toScreen(cpts)
    out.cityVisible = cpts.length
    // the panels on screen, so a check can assert none overlaps him
    out.panels = [...document.querySelectorAll('.panel, .card, .nav')].map((el) => { const r2 = el.getBoundingClientRect(); return { x0: Math.round(r2.left), y0: Math.round(r2.top), x1: Math.round(r2.right), y1: Math.round(r2.bottom) } }).filter((b) => b.x1 > 0 && b.y1 > 0 && b.x0 < innerWidth && b.y0 < innerHeight)
    out.view = [innerWidth, innerHeight]; out.prog = state.prog(); out.dpr = r.getPixelRatio()
    return out
  }
  // the planted feet, in the slope frame (metres), to measure drift over a stance
  window.__feet = () => ({ balls: fig.Pw && [fig.Pw.toeL.toArray(), fig.Pw.toeR.toArray()], stance: [...fig.update(state.tau(), state.pose()).stance], tau: state.tau() })
  // the hands against the glass: for every skinned vertex that belongs mostly to a hand bone, its signed
  // distance to the displaced rock surface (metres; negative is inside the glass). gap = the closest
  // palm-side vertex, depth = the deepest, touching = vertices within 1 cm of the surface. Also each hand's
  // extent in its own frame (fingers, palm normal, lateral; from the wrist) and its screen box, for the crops
  window.__hands = () => {
    ctx.scene.updateMatrixWorld(); const o0 = fig.update(state.tau(), state.pose()); ctx.scene.updateMatrixWorld(); fig.mesh.skeleton.update()
    const mesh = fig.mesh, geo = mesh.geometry, si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight
    const names = mesh.skeleton.bones.map((b) => b.name)
    const inv = fig.boulder.matrixWorld.clone().invert(), p = new THREE.Vector3(), q = new THREE.Vector3(), lat = new THREE.Vector3()
    const res = { tau: state.tau(), hands: [] }
    for (const [i, s] of [[0, 'L'], [1, 'R']]) {
      const bi = names.indexOf('hand' + s), h = o0.hands[i]
      lat.crossVectors(h.n, h.fingers)
      let gap = 1e9, depth = -1e9, touching = 0, n = 0
      const ext = { along: [1e9, -1e9], palm: [1e9, -1e9], lat: [1e9, -1e9] }
      const pts = []
      for (let v = 0; v < si.count; v++) {
        let w = 0
        for (let k = 0; k < 4; k++) if (si.getComponent(v, k) === bi) w += sw.getComponent(v, k)
        if (w < 0.5) continue
        mesh.getVertexPosition(v, p) // skinned, mesh local (the mesh node is the identity under the rig)
        p.applyMatrix4(mesh.matrixWorld); pts.push(p.clone())
        q.copy(p).applyMatrix4(inv); const r = q.length(); q.divideScalar(r)
        const d = r - rockRadius(q, R)
        // in the hand frame: the slope-frame wrist and axes, taken to world through the group
        const ws = h.wrist.clone().applyMatrix4(fig.group.matrixWorld)
        const rel = p.clone().sub(ws)
        const a = rel.dot(h.fingers.clone().transformDirection(fig.group.matrixWorld)), pn = -rel.dot(h.n.clone().transformDirection(fig.group.matrixWorld)), l = rel.dot(lat.clone().transformDirection(fig.group.matrixWorld))
        ext.along[0] = Math.min(ext.along[0], a); ext.along[1] = Math.max(ext.along[1], a)
        ext.palm[0] = Math.min(ext.palm[0], pn); ext.palm[1] = Math.max(ext.palm[1], pn)
        ext.lat[0] = Math.min(ext.lat[0], l); ext.lat[1] = Math.max(ext.lat[1], l)
        // the palm side: toward the glass of the bone axis
        if (pn > 0.004) gap = Math.min(gap, d)
        depth = Math.max(depth, -d); if (Math.abs(d) < 0.01) touching++; n++
      }
      res.hands.push({ side: s, gap, depth, touching, n, ext, box: toScreen(pts), contact: h.c.toArray(), normal: h.n.toArray(), wrist: h.wrist.toArray(), fingers: h.fingers.toArray(), head: fig.Pw['hand' + s].toArray(), elbow: fig.Pw['foreArm' + s].toArray(), shoulder: fig.Pw['upperArm' + s].toArray() })
    }
    return res
  }
}

export function removeHooks() {
  for (const k of ['__CAM', '__LIGHT', '__CITY', '__prog', '__objs', '__frameAt', '__bench', '__bounds', '__feet', '__hands', '__ready', '__stats']) {
    try { delete window[k] } catch { window[k] = undefined }
  }
}
