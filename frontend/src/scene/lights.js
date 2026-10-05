/*
  The lights (DESIGN.md 3.6), as built in a3's boulder.js:

    hemisphere   0x9ec1ff / 0x0b0d14 at 1.3, rising to 1.6 with the dawn
    key          DirectionalLight 0xd6ecff 2.0 along (-5, 9, 7), 12.4 m from him, a 2048 shadow (full)
                 whose camera snaps to its own texels every frame so the shadow never swims
    practicals   two PointLights inside the rock, raised 0.6 R so they never pool white on the ground;
                 the terrain takes their diffuse only (terrain.js)
    rims         two SpotLights on a point 1.2 m above his feet: cyan uphill, magenta downhill, both
                 pulsing +15% with the push-off
    exposure     1.2 easing to 1.05 with the dawn; fog 0x0a1526, 0.011 to 0.006 over p (lite 0.015 to 0.009),
                 lerping to 0x1d3a52 with the dawn
*/
import * as THREE from 'three'

export const LIGHT = { hemi: [1.3, 1.6], exposure: [1.2, 1.05] }
export const FOG = { full: [0x0a1526, 0.011, 0.006], lite: [0x0a1526, 0.015, 0.009], pale: 0x1d3a52 }

export function makeLights(scene, { full = true, R = 1.95 } = {}) {
  const hemi = new THREE.HemisphereLight(0x9ec1ff, 0x0b0d14, LIGHT.hemi[0]); scene.add(hemi)
  const key = new THREE.DirectionalLight(0xd6ecff, 2.0)
  key.castShadow = full
  if (full) { key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0003; key.shadow.normalBias = 0.03; key.shadow.radius = 3; Object.assign(key.shadow.camera, { left: -8, bottom: -8, right: 8, top: 8, near: 0.5, far: 40 }) }
  scene.add(key, key.target)
  const pc = new THREE.PointLight(0x19e6ff, 14, 24, 2), pm = new THREE.PointLight(0xff3dbb, 5, 14, 2)
  scene.add(pc, pm)
  const rimA = new THREE.SpotLight(0x5ff3ff, 22, 14, 0.32, 0.7, 1.6), rimB = new THREE.SpotLight(0xff4de0, 16, 14, 0.32, 0.7, 1.6)
  scene.add(rimA, rimA.target, rimB, rimB.target)

  const lightDir = new THREE.Vector3(-5, 9, 7).normalize()
  const lightRight = new THREE.Vector3(), lightUp = new THREE.Vector3(), tmp = new THREE.Vector3(), off = new THREE.Vector3()
  const rimA0 = rimA.intensity, rimB0 = rimB.intensity
  const texel = 16 / 2048

  return {
    hemi, key, pc, pm, rimA, rimB,
    /** B: the rock's world centre; anchor: a world point 1.5 m above his feet; push: the push-off pulse 0..1 */
    update({ B, anchor, F, push, up, dawn }) {
      pc.position.copy(B).add(tmp.set(-0.4, 0.6 * R, 0.5)); pm.position.copy(B).add(tmp.set(0.5, 0.6 * R, -0.4))
      rimA.position.copy(anchor).add(off.set(2.5, 4.5, -3.5)); rimA.target.position.copy(anchor)
      rimB.position.copy(anchor).add(off.set(-3.5, 3.5, 2.5)); rimB.target.position.copy(anchor)
      rimA.intensity = rimA0 * (1 + 0.15 * push); rimB.intensity = rimB0 * (1 + 0.15 * push)
      // the key light's shadow camera snaps to its own texels, so the shadow never swims
      lightRight.crossVectors(lightDir, up).normalize(); lightUp.crossVectors(lightRight, lightDir).normalize()
      const ox = Math.round(F.dot(lightRight) / texel) * texel - F.dot(lightRight), oy = Math.round(F.dot(lightUp) / texel) * texel - F.dot(lightUp)
      tmp.copy(F).addScaledVector(lightRight, ox).addScaledVector(lightUp, oy)
      key.target.position.copy(tmp); key.position.copy(tmp).addScaledVector(lightDir, 12.4)
      hemi.intensity = THREE.MathUtils.lerp(LIGHT.hemi[0], LIGHT.hemi[1], dawn / 0.35)
    },
  }
}
