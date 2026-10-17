/*
  The boulder's shape: the site's sphere with a 3.5% sine-product bump (a stone worn round by rolling),
  with an exact CPU mirror of its surface so the figure's palms (figure.js, `surface`) land on the real
  displaced rock. On the vase it reads as the painter's added-white disk (vase.js paints it).

    rockShape('polished', R)  -> { geometry, radius(dir), surface(dir, R, outPoint, outNormal) }
*/
import * as THREE from 'three'

const bump = (x, y, z, R) => Math.sin(x * 2.1 / R + 1.3) * Math.sin(y * 1.7 / R - 0.4) * Math.sin(z * 2.3 / R + 2.1) + 0.5 * Math.sin(x * 5.3 / R) * Math.sin(z * 4.7 / R)

export function rockShape(kind = 'polished', R = 1) {
  if (kind !== 'polished') throw new Error(`rockShape: only 'polished' ships (asked for '${kind}')`)
  const radius = (d) => R * (1 + 0.035 * bump(d.x * R, d.y * R, d.z * R, R))
  const g = new THREE.SphereGeometry(R, 160, 120)
  const pos = g.attributes.position, v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize()
    v.multiplyScalar(radius(v))
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  g.computeVertexNormals()
  const _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3(), _d1 = new THREE.Vector3(), _d2 = new THREE.Vector3(), _p1 = new THREE.Vector3(), _p2 = new THREE.Vector3()
  function surface(dir, _R, outPoint, outNormal) {
    const r0 = radius(dir)
    outPoint.copy(dir).multiplyScalar(r0)
    _t1.set(0, 1, 0); if (Math.abs(dir.y) > 0.9) _t1.set(1, 0, 0)
    _t1.addScaledVector(dir, -_t1.dot(dir)).normalize(); _t2.crossVectors(dir, _t1)
    const e = 0.01
    _d1.copy(dir).addScaledVector(_t1, e).normalize(); _p1.copy(_d1).multiplyScalar(radius(_d1)).sub(outPoint)
    _d2.copy(dir).addScaledVector(_t2, e).normalize(); _p2.copy(_d2).multiplyScalar(radius(_d2)).sub(outPoint)
    outNormal.crossVectors(_p1, _p2).normalize()
    if (outNormal.dot(dir) < 0) outNormal.negate()
    return r0
  }
  return { geometry: g, radius, surface }
}
