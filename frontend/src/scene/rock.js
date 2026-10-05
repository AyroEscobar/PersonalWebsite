/*
  The liquid-glass boulder, the neon caught inside it, and the neon environment
  (ported from v3/prototypes/a3/src/scene/glass.js; the env has no warm strip,
  so no third hue can reach a reflection).

    glassPresets.premium2(R, tier)  thick clear glass (full tier)
    glassPresets.lite(R)            no transmission pass (phones)
    rockGeometry(R)                 a sphere with a 3.5% sine-product displacement
    neonCore(R)                     helix, ring, heart: HDR, toneMapped false, world space
    neonEnvironment(renderer)       PMREM of a tiny procedural neon room, no HDRI file (sigma 0.1: soft lobes, no hard-edged panels)
*/
import * as THREE from 'three'

export const glassPresets = {
  premium2: (R, tier = 'full') => new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.06, metalness: 0,
    transmission: 1, thickness: R * 0.7, ior: 1.45, dispersion: tier === 'full' ? 0.3 : 0,
    iridescence: 0.2, iridescenceIOR: 1.3, iridescenceThicknessRange: [120, 500],
    attenuationColor: new THREE.Color(0.8, 0.96, 1.0), attenuationDistance: R * 2.2,
    clearcoat: 1, clearcoatRoughness: 0.06, specularIntensity: 1, envMapIntensity: 1.6,
  }),
  // lite: no transmission pass and no bloom. A thin shell: bright fresnel rim (cyan on the lit
  // side, magenta on the far side), one sharp overhead specular, a faint white body. It sits over
  // the same neon core plus a soft additive glow, so the phone rock stays luminous.
  lite: () => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, toneMapped: false,
    uniforms: { uCyan: { value: new THREE.Color(0.55, 1.9, 2.1) }, uMag: { value: new THREE.Color(1.9, 0.45, 1.4) } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vWN; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vWN = normalize(mat3(modelMatrix) * normal); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }',
    fragmentShader: `uniform vec3 uCyan, uMag; varying vec3 vN; varying vec3 vV; varying vec3 vWN;
      void main(){
        vec3 n = normalize(vN), v = normalize(vV);
        float f = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.4);
        vec3 rim = mix(uMag, uCyan, smoothstep(-0.6, 0.5, vWN.x * -0.6 + vWN.y * 0.8));
        vec3 h = normalize(normalize(vec3(-0.25, 0.9, 0.35)) + v);
        float spec = pow(max(dot(n, h), 0.0), 900.0) * 1.4 + pow(max(dot(n, h), 0.0), 40.0) * 0.16;
        vec3 col = rim * f * 0.95 + vec3(spec) + vec3(0.55, 0.75, 0.85) * 0.07;
        float a = clamp(0.07 + f * 0.75 + spec, 0.0, 1.0);
        gl_FragColor = vec4(col, a); 
#include <tonemapping_fragment>
#include <colorspace_fragment>

      }`,
  }),
}

// a soft additive glow around the core (the lite tier's stand-in for bloom), camera-facing
export function coreGlow(R, strength = 1) {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const g = c.getContext('2d'), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grd.addColorStop(0, 'rgba(255,255,255,0.9)'); grd.addColorStop(0.18, 'rgba(160,240,255,0.45)'); grd.addColorStop(0.5, 'rgba(60,170,220,0.12)'); grd.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color: new THREE.Color(1.1 * strength, 1.25 * strength, 1.35 * strength), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false, fog: false }))
  sp.scale.setScalar(R * 2.9)
  return sp
}

export function rockGeometry(R) {
  const g = new THREE.SphereGeometry(R, 160, 120)
  const pos = g.attributes.position, v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const n = Math.sin(v.x * 2.1 / R + 1.3) * Math.sin(v.y * 1.7 / R - 0.4) * Math.sin(v.z * 2.3 / R + 2.1) + 0.5 * Math.sin(v.x * 5.3 / R) * Math.sin(v.z * 4.7 / R)
    v.multiplyScalar(1 + 0.035 * n)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  g.computeVertexNormals()
  return g
}

export function neonCore(R, { halo = false } = {}) {
  const grp = new THREE.Group()
  const mk = (geo, c) => new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: c, toneMapped: false }))
  const pts = []
  for (let i = 0; i <= 220; i++) {
    const u = i / 220, a = u * Math.PI * 4
    pts.push(new THREE.Vector3(Math.cos(a) * R * 0.42 * Math.sin(u * Math.PI), (u - 0.5) * R * 0.9, Math.sin(a) * R * 0.42 * Math.sin(u * Math.PI)))
  }
  const helix = mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, R * 0.016, 8, false), new THREE.Color(0.4, 2.2, 2.6))
  const ring = mk(new THREE.TorusGeometry(R * 0.5, R * 0.012, 8, 160), new THREE.Color(2.7, 0.5, 2.0))
  ring.rotation.x = Math.PI / 2.6; ring.rotation.z = 0.3
  const heart = mk(new THREE.SphereGeometry(R * 0.06, 24, 16), new THREE.Color(3.2, 3.2, 3.2))
  grp.add(helix, ring, heart)
  // lite has no bloom: a wide, faint additive copy of each tube stands in for the halo
  if (halo) {
    const hm = (geo, c) => new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: c, toneMapped: false, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false }))
    const h1 = hm(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, R * 0.09, 8, false), new THREE.Color(0.4, 2.2, 2.6))
    const h2 = hm(new THREE.TorusGeometry(R * 0.5, R * 0.075, 8, 120), new THREE.Color(2.6, 0.5, 1.9)); h2.rotation.copy(ring.rotation)
    grp.add(h1, h2)
  }
  grp.userData.spin = helix
  return grp
}

export function neonEnvironment(renderer, { intensity = 0.8 } = {}) {
  const s = new THREE.Scene()
  s.add(new THREE.Mesh(new THREE.BoxGeometry(40, 20, 40), new THREE.MeshBasicMaterial({ color: 0x0a0c14, side: THREE.BackSide })))
  const panel = (w, h, c, p, rot) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c.multiplyScalar(intensity), side: THREE.DoubleSide })); m.position.set(...p); m.rotation.set(...rot); s.add(m) }
  panel(18, 5, new THREE.Color(4.5, 4.6, 5.2), [0, 9.9, -2], [Math.PI / 2, 0, 0])       // wide soft overhead: the top highlight on the rock
  panel(14, 9, new THREE.Color(0.15, 2.8, 3.8), [-19.9, 4, 0], [0, Math.PI / 2, 0])     // cyan wall
  panel(14, 9, new THREE.Color(3.8, 0.4, 2.8), [19.9, 3, 0], [0, -Math.PI / 2, 0])      // magenta wall
  panel(40, 0.7, new THREE.Color(1.6, 2.4, 3.0), [0, -1, -19.9], [0, 0, 0])             // cool horizon strip (the city side)
  panel(10, 3, new THREE.Color(1.2, 1.4, 2.0), [4, 6, 19.9], [0, Math.PI, 0])
  panel(40, 40, new THREE.Color(0.12, 0.14, 0.2), [0, -9.9, 0], [-Math.PI / 2, 0, 0])
  const pm = new THREE.PMREMGenerator(renderer)
  const tex = pm.fromScene(s, 0.1).texture
  pm.dispose()
  s.traverse((o) => { o.geometry?.dispose(); o.material?.dispose() })
  return tex
}

// rain beaded on the glass: small flattened droplets on the surface, parented to the rock so they
// ride its roll (a smooth sphere looks the same rolling or sliding; these make the roll legible)
export function droplets(R, count = 90, { lite = false } = {}) {
  const geo = new THREE.SphereGeometry(1, 10, 6)
  // full: dark clearcoat beads that catch the neon room; lite (no transmission under them): pure specular beads, no body colour, so they never read as dust
  const mat = lite
    ? new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.8, transparent: true, opacity: 0.2 })
    : new THREE.MeshPhysicalMaterial({ color: 0x0b1118, roughness: 0.03, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.4, transparent: true, opacity: 0.8 })
  const m = new THREE.InstancedMesh(geo, mat, count)
  const h = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s) }
  const o = new THREE.Object3D(), n = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0)
  for (let i = 0; i < count; i++) {
    const u = h(i, 1) * 2 - 1, a = h(i, 2) * Math.PI * 2, r = Math.sqrt(1 - u * u)
    n.set(r * Math.cos(a), u, r * Math.sin(a))
    const size = R * (0.007 + h(i, 3) * 0.016)
    // seat it on the displaced surface (same sine product as rockGeometry)
    const x = n.x * R, y = n.y * R, z = n.z * R
    const disp = Math.sin(x * 2.1 / R + 1.3) * Math.sin(y * 1.7 / R - 0.4) * Math.sin(z * 2.3 / R + 2.1) + 0.5 * Math.sin(x * 5.3 / R) * Math.sin(z * 4.7 / R)
    o.position.copy(n).multiplyScalar(R * (1 + 0.035 * disp) + size * 0.15)
    o.quaternion.setFromUnitVectors(up, n)
    o.scale.set(size, size * 0.35, size * (1 + h(i, 4) * 0.6))
    o.updateMatrix(); m.setMatrixAt(i, o.matrix)
  }
  m.castShadow = false
  return m
}
