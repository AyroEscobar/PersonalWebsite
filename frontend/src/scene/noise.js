/*
  Shared GLSL noise (written for this lab, no third-party code): a 3D value noise with a quintic fade,
  fbm, a domain warp and an anti-aliased isoline. Cheap: one noise() is 8 hashes.
    NOISE_GLSL   paste into a shader after #include <common>
  And the same 3D value noise in JS (vnoise3, fbm3) so the CPU can mirror a displaced surface exactly.
*/
export const NOISE_GLSL = /* glsl */ `
float lh31(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vnoise3(vec3 p){
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = lh31(i), b = lh31(i + vec3(1,0,0)), c = lh31(i + vec3(0,1,0)), d = lh31(i + vec3(1,1,0));
  float e = lh31(i + vec3(0,0,1)), f1 = lh31(i + vec3(1,0,1)), g = lh31(i + vec3(0,1,1)), h = lh31(i + vec3(1,1,1));
  return mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y), mix(mix(e, f1, u.x), mix(g, h, u.x), u.y), u.z);
}
float fbm3(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += a * vnoise3(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }
float fbm3l(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 3; i++){ s += a * vnoise3(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }
vec3 warp3(vec3 p, float k){ return p + k * vec3(fbm3l(p), fbm3l(p + 5.2), fbm3l(p + 9.7)); }
// an anti-aliased line on the isoline f = c, w wide in f units (never thinner than a pixel)
float isoline(float f, float c, float w){ float d = abs(f - c); float fw = fwidth(f); return 1.0 - smoothstep(w, w + fw * 1.5, d); }
`

const fract = (x) => x - Math.floor(x)
function lh31(x, y, z) {
  x = fract(x * 0.1031); y = fract(y * 0.1031); z = fract(z * 0.1031)
  const d = x * (z + 31.32) + y * (y + 31.32) + z * (x + 31.32)
  x += d; y += d; z += d
  return fract((x + y) * z)
}
export function vnoise3(px, py, pz) {
  const ix = Math.floor(px), iy = Math.floor(py), iz = Math.floor(pz)
  const fx = px - ix, fy = py - iy, fz = pz - iz
  const q = (f) => f * f * f * (f * (f * 6 - 15) + 10)
  const ux = q(fx), uy = q(fy), uz = q(fz)
  const L = (a, b, t) => a + (b - a) * t
  const a = lh31(ix, iy, iz), b = lh31(ix + 1, iy, iz), c = lh31(ix, iy + 1, iz), d = lh31(ix + 1, iy + 1, iz)
  const e = lh31(ix, iy, iz + 1), f = lh31(ix + 1, iy, iz + 1), g = lh31(ix, iy + 1, iz + 1), h = lh31(ix + 1, iy + 1, iz + 1)
  return L(L(L(a, b, ux), L(c, d, ux), uy), L(L(e, f, ux), L(g, h, ux), uy), uz)
}
export function fbm3(x, y, z, oct = 5) {
  let s = 0, a = 0.5
  for (let i = 0; i < oct; i++) { s += a * vnoise3(x, y, z); x = x * 2.03 + 1.7; y = y * 2.03 + 9.2; z = z * 2.03 + 3.1; a *= 0.5 }
  return s
}
