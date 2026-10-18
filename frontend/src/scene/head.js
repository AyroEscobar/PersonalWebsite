/*
  The painter's head, baked into the figure's skinned geometry at load (no asset bytes, no draw calls):
  the Munich painter's Sisyphus has a pointed beard, hair to the nape under an incised fillet, and an
  almond eye, where the base mesh had a bald round dome.

    addParts(geo, { scale })   merges the beard and the nape mass (closed slabs skinned to the head bone)
                               into geo and writes aPart (vec2): x = 1 where no interior line is drawn
                               (the beard, the hair), y = the inflate scale (1 on the body, 0 on the
                               merged slabs, which carry their own thickness)
    HEAD                       the hairline, the fillet and the eye, in metres (model space, side view
                               profile: z forward, y up, x to his left); vase.js turns them into uniforms

  The figure in model space faces +z with his left at +x; the side the camera sees is his right (model -x).
  Model units are metres / scale with y shifted by one (the mesh is quantized to -1..1 in y).
*/
import * as THREE from 'three'

// bone index in the rig (tools/build-figure.mjs): the head
const HEAD_BONE = 4

// the profiles, metres in (z, y): a pointed beard from the sideburn along the jaw to a point below and in
// front of the chin, and a mass of hair down the nape
export const BEARD = [
  [-0.012, 1.655], [0.012, 1.632], [0.046, 1.612], [0.074, 1.6], [0.094, 1.592], [0.101, 1.574],
  [0.11, 1.548], [0.118, 1.506], [0.098, 1.516], [0.07, 1.532], [0.036, 1.548], [0.0, 1.574], [-0.026, 1.61],
]
// the profiles' triangles, ear-clipped once (THREE.ShapeUtils, offline) so the chunk carries no earcut
const TRIS = {
  beard: [1, 0, 12, 12, 11, 10, 9, 8, 7, 7, 6, 5, 5, 4, 3, 2, 1, 12, 12, 10, 9, 9, 7, 5, 5, 3, 2, 2, 12, 9, 9, 5, 2],
  nape: [8, 9, 0, 0, 1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 8, 8, 0, 2, 2, 4, 6, 6, 8, 2],
}
export const NAPE = [
  [-0.062, 1.705], [-0.098, 1.7], [-0.118, 1.672], [-0.124, 1.63], [-0.12, 1.585], [-0.118, 1.548],
  [-0.1, 1.54], [-0.084, 1.548], [-0.072, 1.585], [-0.06, 1.64],
]

export const HEAD = {
  // the hair cap: the skull above the plane y = a + b z (metres) is pushed out by cap
  hair: { a: 1.703, b: 0.4, cap: 0.009 },
  // the fillet: an incised line round the skull this far above the hairline
  fillet: 0.016,
  // the eye: an incised almond on the side the camera sees
  eye: { z: 0.071, y: 1.681, rz: 0.015, ry: 0.0085 },
  // the beard's edge on the cheek, from the sideburn to the corner of the mouth (an incised line)
  beardEdge: [[-0.012, 1.655], [0.078, 1.598]],
}

function slab(profile, halfW, scale, tris) {
  // a closed prism: the profile at x = -halfW and at x = +halfW, the rim between them; shared vertices so
  // computeVertexNormals rounds the corners (the hull outline needs outward normals, never flat ones)
  const n = profile.length
  const pos = []
  for (const side of [-1, 1]) for (const [z, y] of profile) pos.push((side * halfW) / scale, y / scale - 1, z / scale)
  const idx = []
  // caps: the ear-clipped profile, once per side with opposite windings
  for (let k = 0; k < tris.length; k += 3) {
    const a = tris[k], b = tris[k + 1], c = tris[k + 2]
    idx.push(a, c, b)
    idx.push(n + a, n + b, n + c)
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    idx.push(i, j, n + j, i, n + j, n + i)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  // make sure the fan winding faces out (the profiles run clockwise in (z, y) seen from -x)
  const nx = g.attributes.normal.getX(0)
  if (nx > 0) {
    const a = g.index.array
    for (let k = 0; k < a.length; k += 3) { const t = a[k + 1]; a[k + 1] = a[k + 2]; a[k + 2] = t }
    g.computeVertexNormals()
  }
  return g
}

export function addParts(geo, { scale = 0.9 } = {}) {
  const parts = [slab(BEARD, 0.088, scale, TRIS.beard), slab(NAPE, 0.058, scale, TRIS.nape)]
  const n0 = geo.attributes.position.count
  const extra = parts.reduce((a, g) => a + g.attributes.position.count, 0)
  const n = n0 + extra
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), SI = new Uint16Array(n * 4), SW = new Float32Array(n * 4), C = new Float32Array(n), A = new Float32Array(n * 2)
  const p0 = geo.attributes.position, nr = geo.attributes.normal, si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight, cv = geo.attributes.aCurv
  for (let i = 0; i < n0; i++) {
    P[i * 3] = p0.getX(i); P[i * 3 + 1] = p0.getY(i); P[i * 3 + 2] = p0.getZ(i)
    N[i * 3] = nr.getX(i); N[i * 3 + 1] = nr.getY(i); N[i * 3 + 2] = nr.getZ(i)
    for (let c = 0; c < 4; c++) { SI[i * 4 + c] = si.getComponent(i, c); SW[i * 4 + c] = sw.getComponent(i, c) }
    C[i] = cv ? cv.getX(i) : 0
    A[i * 2] = 0
    A[i * 2 + 1] = 1
  }
  const index = Array.from(geo.index.array)
  let o = n0
  for (const g of parts) {
    const gp = g.attributes.position, gn = g.attributes.normal
    for (let k = 0; k < gp.count; k++) {
      const i = o + k
      P[i * 3] = gp.getX(k); P[i * 3 + 1] = gp.getY(k); P[i * 3 + 2] = gp.getZ(k)
      N[i * 3] = gn.getX(k); N[i * 3 + 1] = gn.getY(k); N[i * 3 + 2] = gn.getZ(k)
      SI[i * 4] = HEAD_BONE; SW[i * 4] = 1
      A[i * 2] = 1; A[i * 2 + 1] = 0
    }
    for (const v of g.index.array) index.push(o + v)
    o += gp.count
    g.dispose()
  }
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3))
  geo.setAttribute('normal', new THREE.BufferAttribute(N, 3))
  geo.setAttribute('skinIndex', new THREE.BufferAttribute(SI, 4))
  geo.setAttribute('skinWeight', new THREE.BufferAttribute(SW, 4))
  geo.setAttribute('aCurv', new THREE.BufferAttribute(C, 1))
  geo.setAttribute('aPart', new THREE.BufferAttribute(A, 2))
  geo.setIndex(index)
  geo.computeBoundingBox(); geo.computeBoundingSphere()
  return geo
}

/** The head's uniforms in model units (vMP is the bind-pose position). */
export function headUniforms(scale = 0.9) {
  const { hair, fillet, eye, beardEdge } = HEAD
  const [[z0, y0], [z1, y1]] = beardEdge
  return {
    uBeard: new THREE.Vector4(z0 / scale, y0 / scale - 1, z1 / scale, y1 / scale - 1),
    // y_model > a' + b z_model  <=>  y_m > a + b z_m, with y_m = (y + 1) scale and z_m = z scale
    uHair: new THREE.Vector4(hair.a / scale - 1, hair.b, hair.cap / scale, fillet / scale),
    uEye: new THREE.Vector4(eye.z / scale, eye.y / scale - 1, eye.rz / scale, eye.ry / scale),
  }
}
