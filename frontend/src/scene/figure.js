/*
  The man: a real human body (assets/figure/man.glb, built by tools/build-figure.mjs from the
  CC-BY 3.0 "Male base" mesh by Артур Мигранов, auto-rigged with 21 joints) driven by a push
  solver on its bones. Everything is solved in the slope frame: ground is y = 0, uphill is +x,
  his right is +z. The caller rotates the group by the slope angle.

    const fig = await loadFigure(url)            // fetch + decode the GLB (meshopt)
    const f = makeFigure({ man: fig, material, boulderMaterial, boulderGeometry, R })
    f.update(tau, { shift, leanAdd, crouch })    // tau is the cycle clock (frozen during a slip)

  The body, as a solver:
    - root speed v, step period T, stance duty d. A stance foot is pinned at its footfall; the
      foot is rigid (ankle, ball, toe in one frame) and in the last part of stance the heel rises
      about the planted ball, so the rear leg straightens into the push-off. Swing lifts the foot
      on an arc and sets it down flat. Feet never slide: footfall k lands at root(t_k) + const.
    - the pelvis sits at 0.75 of the standing hip height and bobs 2 cm at twice the step rate;
      the torso leans so the line from the rear heel to the head is about 40 degrees off the
      slope; the head bows toward the rock.
    - the shoulders come out of the chest by forward kinematics (the clavicles protract), the
      hands are planted flat on the rock's surface along the line from the shoulder to the rock's
      centre (push through the centre), elbows bent and loaded; analytic two-bone IK for arms
      and legs with poles (elbows down and out, knees forward).
    - the rock is placed from the hands and rolls by -x / R, so omega = v / R at every instant.
  Bone orientations come from target directions plus a reference axis per bone (bend planes for
  the limbs, the palm normal for the hands), written as local quaternions on the skeleton.
*/
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

export async function loadFigure(url) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  const g = await loader.loadAsync(url)
  let mesh = null
  g.scene.traverse((o) => { if (o.isSkinnedMesh) mesh = o })
  const ex = g.scene.userData || {}
  return { root: g.scene, mesh, heads: ex.heads, tails: ex.tails }
}

const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _u = new THREE.Vector3()
const _m0 = new THREE.Matrix4(), _m1 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _qr = new THREE.Quaternion(), _qr2 = new THREE.Quaternion()
const X = new THREE.Vector3(1, 0, 0), Yv = new THREE.Vector3(0, 1, 0), Zv = new THREE.Vector3(0, 0, 1)

// rotation taking the frame (d0, r0) to (d1, r1); r is made orthogonal to d
function frameRot(d0, r0, d1, r1, out) {
  const a = d0.clone().normalize(), b = _v.copy(r0).addScaledVector(a, -r0.dot(a)).normalize(), c = _w.crossVectors(a, b)
  _m0.makeBasis(a, b, c)
  const a1 = d1.clone().normalize(), b1 = _u.copy(r1).addScaledVector(a1, -r1.dot(a1)).normalize(), c1 = new THREE.Vector3().crossVectors(a1, b1)
  _m1.makeBasis(a1, b1, c1)
  _m1.multiply(_m0.transpose())
  return out.setFromRotationMatrix(_m1)
}
// analytic two-bone IK: root A, target T, lengths l1 l2, pole P; returns the middle joint
function ik(A, T, l1, l2, P, out) {
  const d = new THREE.Vector3().subVectors(T, A)
  let L = d.length()
  const reach = l1 + l2 - 1e-4
  if (L > reach) { d.multiplyScalar(reach / L); L = reach }
  L = Math.max(L, Math.abs(l1 - l2) + 1e-4)
  d.normalize()
  const a = Math.acos(THREE.MathUtils.clamp((l1 * l1 + L * L - l2 * l2) / (2 * l1 * L), -1, 1))
  const side = new THREE.Vector3().copy(P).addScaledVector(d, -P.dot(d)).normalize()
  return out.copy(A).addScaledVector(d, Math.cos(a) * l1).addScaledVector(side, Math.sin(a) * l1)
}
const sstep = (a, b, x) => { const u = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u) }

// the contact: how the palm meets the glass (metres). The mesh hand is splayed and cupped (no finger
// bones), so it is not pressed along its bone: it rests on its natural support plane, the face a flat
// surface touches when the hand is pressed on it (fingertip pads and the heel of the hand, the palm
// arched between them), measured on the bind pose in tools: the plane normal and the heel-to-fingertip
// line in model space for the left hand (the right is its mirror), the bone head 2.5 cm behind the plane
// and the contact centroid 10 cm up the line.
export const HAND = {
  press: 0.012,   // the support points sit this far inside the displaced rock, so no gap ever shows
  normal: [-0.9417, -0.216, -0.258], // model space, left hand: the support plane's normal, toward the rock
  axis: [0.2, -0.976, 0.09],         // model space, left hand: heel to fingertips, in the plane
  height: 0.0247, // bone head to the plane
  along: 0.10,    // head to the contact centroid along the axis
  lat: 0.019,     // ... and across (toward the thumb)
  up: 0.75,       // the finger line: up the surface ...
  out: 0.66,      // ... and turned outward, like a hand pushing a wall, so the wrist is not folded flat back
}
const sphereSurface = (dir, R, p, n) => { p.copy(dir).multiplyScalar(R); n.copy(dir); return R }

export function makeFigure({ man, material, boulderMaterial, boulderGeometry, R = 2.1, speed = 0.33, period = 1.9, duty = 0.7, leanDeg = 50, pelvisK = 0.7, handLift = 0, frontK = 0.16, x0 = 0, sole = 0, surface = sphereSurface } = {}) {
  const group = new THREE.Group()
  // model space faces +z with its left at +x; the slope frame faces +x with the right at +z
  const rig = new THREE.Group(); rig.rotation.y = Math.PI / 2; group.add(rig)
  rig.add(man.root)
  const mesh = man.mesh
  mesh.material = material
  mesh.castShadow = true; mesh.receiveShadow = true
  mesh.frustumCulled = false
  const bones = {}
  mesh.skeleton.bones.forEach((b) => (bones[b.name] = b))
  const Qc = new THREE.Quaternion().setFromAxisAngle(Yv, Math.PI / 2), QcInv = Qc.clone().invert()
  const toSlope = (a) => new THREE.Vector3(a[2], a[1], -a[0]) // Ry(+90): (x, y, z) -> (z, y, -x)
  const H = {}, Tl = {}
  for (const k in man.heads) { H[k] = toSlope(man.heads[k]); Tl[k] = toSlope(man.tails[k]) }
  const parent = {}; mesh.skeleton.bones.forEach((b) => (parent[b.name] = b.parent && b.parent.isBone ? b.parent.name : null))
  const off = {}; for (const k in H) off[k] = parent[k] ? H[k].clone().sub(H[parent[k]]) : H[k].clone()
  const restDir = {}; for (const k in H) restDir[k] = Tl[k].clone().sub(H[k]).normalize()
  const mirror = (a, s) => toSlope(s === 'L' ? a : [-a[0], a[1], a[2]]).normalize()
  const handAxis = { L: mirror(HAND.axis, 'L'), R: mirror(HAND.axis, 'R') }, handNormal = { L: mirror(HAND.normal, 'L'), R: mirror(HAND.normal, 'R') }
  const len = (a, b) => H[a].distanceTo(H[b])
  const Lt = len('thighL', 'shinL'), Ls = len('shinL', 'footL'), La = len('upperArmL', 'foreArmL'), Lf = len('foreArmL', 'handL')
  const hipH = H.hips.y // standing hip height (0.96)
  const ballOff = H.toeL.clone().sub(H.footL) // ankle -> ball, rest (slope)
  const ballY = H.toeL.y

  const boulder = new THREE.Mesh(boulderGeometry, boulderMaterial)
  boulder.castShadow = true; boulder.receiveShadow = false
  group.add(boulder)
  // where the palms meet the rock, kept as two empty markers (the vase has no contact glint)
  const glints = [new THREE.Object3D(), new THREE.Object3D()]
  group.add(glints[0], glints[1])
  const handU = material.userData.u?.uHand?.value // a material that wants the contacts (world space)

  const v0 = speed, T = period, d = duty
  const front = frontK // the ball lands this far behind the hips; push-off is a stance length further back
  const lift = 0.1
  const rootX = (t) => x0 + v0 * t
  const footZ = 0.125
  function foot(t, phase, out) {
    const k = Math.floor(t / T - phase)
    const u = (t - (k + phase) * T) / T
    const landX = (kk) => rootX((kk + phase) * T) - front
    if (u < d) { out.x = landX(k); out.y = 0; out.u = u / d; out.stance = true; return out }
    const w = (u - d) / (1 - d), e = w * w * (3 - 2 * w)
    out.x = THREE.MathUtils.lerp(landX(k), landX(k + 1), e); out.y = lift * Math.sin(Math.PI * Math.pow(w, 0.8)); out.u = w; out.stance = false
    return out
  }

  // world rotation (relative to rest) of each bone this frame, and world joint positions
  const Rw = {}, Pw = {}
  for (const k in H) { Rw[k] = new THREE.Quaternion(); Pw[k] = new THREE.Vector3() }
  const fk = (k) => Pw[k].copy(off[k]).applyQuaternion(Rw[parent[k]]).add(Pw[parent[k]])
  const setBone = (k, q) => {
    Rw[k].copy(q)
    const b = bones[k]
    // local = inv(Rparent * Qc) * (R * Qc)
    const pr = parent[k] ? Rw[parent[k]] : _q2.identity()
    b.quaternion.copy(Qc).premultiply(q).premultiply(_q.copy(pr).multiply(Qc).invert())
  }
  const aimBone = (k, dir, ref, restRef) => setBone(k, frameRot(restDir[k], restRef, dir, ref, new THREE.Quaternion()))

  const tmp = { a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), e: new THREE.Vector3(), n: new THREE.Vector3() }
  const fl = {}, fr = {}
  const hand = () => ({ c: new THREE.Vector3(), n: new THREE.Vector3(), fingers: new THREE.Vector3(), wrist: new THREE.Vector3() })
  const hands = [hand(), hand()] // the contact point on the rock, its true normal, the finger line and the wrist (slope frame)
  const out = { x: 0, bx: 0, push: 0, feet: [new THREE.Vector3(), new THREE.Vector3()], heels: [new THREE.Vector3(), new THREE.Vector3()], pitch: [0, 0], chestY: 0, hands }
  const poleArm = { L: new THREE.Vector3(-0.35, -1, -0.75).normalize(), R: new THREE.Vector3(-0.35, -1, 0.75).normalize() }
  const poleKnee = new THREE.Vector3(1, 0.1, 0)
  const zSide = { L: -1, R: 1 }

  function update(t, { shift = 0, leanAdd = 0, crouch = 0, reachAdd = 0 } = {}) {
    const x = rootX(t) - shift
    foot(t, 0, fl); foot(t, 0.5, fr)
    fl.x -= shift; fr.x -= shift
    const ph = t / T
    const bob = 0.02 * Math.cos(2 * Math.PI * ph * 2)
    const pelvisY = hipH * pelvisK + bob - crouch + sole
    // weight: a 3 degree torso pitch with the step, a little hip roll and sway toward the stance side
    const lean = THREE.MathUtils.degToRad(leanDeg + leanAdd + 1.5 * Math.sin(2 * Math.PI * ph * 2))
    const roll = 0.05 * Math.sin(2 * Math.PI * ph), sway = 0.015 * Math.sin(2 * Math.PI * ph)
    // push-off pulse: a Gaussian at the end of each stance
    const pu = (u) => Math.exp(-(((u - 0.92) / 0.08) ** 2))
    out.push = Math.max(fl.stance ? pu(fl.u) : 0, fr.stance ? pu(fr.u) : 0)

    // ---- the trunk
    const dir = (deg) => new THREE.Vector3(Math.sin(lean + THREE.MathUtils.degToRad(deg)), Math.cos(lean + THREE.MathUtils.degToRad(deg)), 0)
    const sideRef = new THREE.Vector3(0, Math.sin(roll), 1).normalize()
    Pw.hips.set(x, pelvisY, sway)
    aimBone('hips', dir(-14), sideRef, Zv)
    fk('spine'); aimBone('spine', dir(-3), sideRef, Zv)
    fk('chest'); aimBone('chest', dir(4), new THREE.Vector3(0, -Math.sin(roll) * 0.6, 1).normalize(), Zv)
    fk('neck'); aimBone('neck', dir(-12), Zv, Zv)
    // the head bows toward the rock with the effort, steady against the step (counter-pitch)
    fk('head'); aimBone('head', dir(-4 - 1.5 * Math.sin(2 * Math.PI * ph * 2) * 0.6), Zv, Zv)
    out.chestY = Pw.chest.y

    // ---- the clavicles protract: the shoulders roll forward into the push
    for (const s of ['L', 'R']) {
      const k = 'clav' + s
      fk(k)
      const lat = new THREE.Vector3(0, 0, zSide[s]).applyQuaternion(Rw.chest)
      const fwd = new THREE.Vector3(1, 0, 0).applyQuaternion(Rw.chest)
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(Rw.chest)
      const target = lat.clone().multiplyScalar(0.92).addScaledVector(fwd, 0.32).addScaledVector(up, 0.06)
      aimBone(k, target, fwd, X)
      fk('upperArm' + s)
    }

    // ---- the rock, placed from the hands: push through the centre
    const sh = tmp.a.copy(Pw.upperArmL).add(Pw.upperArmR).multiplyScalar(0.5)
    const stepPulse = 0.5 + 0.5 * Math.cos(2 * Math.PI * ph * 2)
    // hands at chest height (a hand's breadth above the shoulders, in the slope frame), elbows
    // bent and loaded; the rock sits where the palms meet it
    const reach = (La + Lf) * (0.76 + 0.03 * stepPulse + reachAdd) + 0.07
    const RR = R + 0.025
    const handY = sh.y + 0.07 + handLift
    const reachH = Math.sqrt(Math.max(0.01, reach * reach - (handY - sh.y) ** 2))
    const hw = Math.sqrt(Math.max(0, RR * RR - (R - handY) ** 2 - 0.04))
    const bx = sh.x + reachH + hw
    const phi = Math.asin((R - handY) / RR)
    boulder.position.set(bx, R, 0)
    boulder.rotation.set(0, 0, -bx / R)

    // ---- arms and hands
    // the rock's local frame this instant (it has rolled -bx / R about z)
    const toRock = _qr.setFromAxisAngle(Zv, bx / R), fromRock = _qr2.copy(toRock).invert()
    for (const s of ['L', 'R']) {
      const S = Pw['upperArm' + s]
      const i = s === 'L' ? 0 : 1
      const z = zSide[s] * 0.2
      // contact point on the rock at chest height, a little wider than the shoulders: aimed on the
      // nominal sphere, then landed on the real displaced surface in that direction, with its true normal
      const cy = handY + (s === 'L' ? 0.012 : -0.012)
      const c = new THREE.Vector3(bx - Math.sqrt(Math.max(0, RR * RR - (R - cy) ** 2 - z * z)), cy, z)
      const dir = c.clone().sub(boulder.position).normalize().applyQuaternion(toRock)
      const nrm = new THREE.Vector3()
      surface(dir, R, c, nrm)
      c.applyQuaternion(fromRock).add(boulder.position); nrm.applyQuaternion(fromRock)
      const palm = nrm.clone().negate()                                    // palm faces into the rock
      const up = new THREE.Vector3(0, 1, 0).addScaledVector(nrm, -nrm.y).normalize() // up the surface
      const outw = new THREE.Vector3(0, 0, zSide[s]).addScaledVector(nrm, -zSide[s] * nrm.z).normalize() // outward along it
      const fingers = up.multiplyScalar(HAND.up).addScaledVector(outw, HAND.out).normalize() // fingers lie on the rock, up and out
      // the palm surface is pressed into the rock; the bone axis sits a palm's thickness above it
      const latS = palm.clone().cross(fingers) // across the hand, toward the thumb side (mirrors with the hand)
      const wrist = c.clone().addScaledVector(nrm, HAND.height - HAND.press).addScaledVector(fingers, -HAND.along).addScaledVector(latS, HAND.lat * zSide[s])
      hands[i].c.copy(c); hands[i].n.copy(nrm); hands[i].fingers.copy(fingers); hands[i].wrist.copy(wrist)
      // the contact marker under the palm
      const gl = glints[i]
      gl.position.copy(c).addScaledVector(nrm, 0.004)
      _m1.makeBasis(fingers, _v.crossVectors(nrm, fingers), nrm); gl.quaternion.setFromRotationMatrix(_m1)
      gl.scale.set(1.25, 0.9, 1)
      if (handU) handU[i].copy(c).addScaledVector(nrm, -HAND.press).applyMatrix4(group.matrixWorld)
      const el = ik(S, wrist, La, Lf, poleArm[s], new THREE.Vector3())
      const ud = el.clone().sub(S).normalize(), fd = wrist.clone().sub(el).normalize()
      // the biceps side: where the forearm goes; fall back to the pole when the arm is straight
      let ref = fd.clone().addScaledVector(ud, -fd.dot(ud))
      if (ref.lengthSq() < 1e-4) ref.copy(poleArm[s]).negate()
      aimBone('upperArm' + s, ud, ref.normalize(), X)
      fk('foreArm' + s)
      const elbowRot = new THREE.Quaternion().setFromUnitVectors(ud, fd)
      const refT = ref.clone().applyQuaternion(elbowRot)
      // hand first, then share its twist into the forearm so the wrist does not collapse
      // the hand's support plane (bind pose, model space, mirrored for the right) lands on the rock
      const qh = frameRot(handAxis[s], handNormal[s], fingers, palm, new THREE.Quaternion())
      const refFull = X.clone().applyQuaternion(qh)
      refFull.addScaledVector(fd, -refFull.dot(fd)).normalize()
      const refF = refT.clone().lerp(refFull, 0.6).normalize()
      aimBone('foreArm' + s, fd, refF, X)
      fk('hand' + s)
      setBone('hand' + s, qh)
    }

    // ---- legs and the rigid feet
    const legs = [['L', fl], ['R', fr]]
    legs.forEach(([s, f], i) => {
      const z = zSide[s] * footZ
      let pitch // heel lift about the ball, radians
      if (f.stance) pitch = 0.62 * sstep(0.55, 1.0, f.u)
      else pitch = 0.62 * (1 - sstep(0.0, 0.55, f.u)) - 0.12 * Math.sin(Math.PI * sstep(0.3, 1.0, f.u))
      const ball = new THREE.Vector3(f.x, ballY + f.y + sole, z)
      fk('thigh' + s)
      const hip = Pw['thigh' + s]
      // the ball is pinned; if the leg cannot reach the ankle, the heel rises about the ball until
      // it can (99.75% of full length, a knee of about 172 degrees), so the rear leg straightens and
      // the foot never slides. Solved by bisection, so the heel angle is continuous (no 0.025 rad steps)
      const footQ = new THREE.Quaternion(), ankle = new THREE.Vector3()
      const reachMax = (Lt + Ls) * 0.9975
      const ankleAt = (pa) => { footQ.setFromAxisAngle(Zv, -pa); return ankle.copy(ballOff).negate().applyQuaternion(footQ).add(ball) }
      if (ankleAt(pitch).distanceTo(hip) > reachMax) {
        let lo = pitch, hi = 1.35
        for (let k = 0; k < 22; k++) { const mid = (lo + hi) / 2; if (ankleAt(mid).distanceTo(hip) > reachMax) lo = mid; else hi = mid }
        pitch = hi; ankleAt(pitch)
      }
      out.pitch[i] = pitch
      const knee = ik(hip, ankle, Lt, Ls, poleKnee, new THREE.Vector3())
      const td = knee.clone().sub(hip).normalize(), sd = ankle.clone().sub(knee).normalize()
      let ref = sd.clone().addScaledVector(td, -sd.dot(td)).negate()
      if (ref.lengthSq() < 1e-4) ref.copy(X)
      aimBone('thigh' + s, td, ref.normalize(), X)
      fk('shin' + s)
      aimBone('shin' + s, sd, ref.clone().applyQuaternion(new THREE.Quaternion().setFromUnitVectors(td, sd)), X)
      fk('foot' + s)
      setBone('foot' + s, footQ)
      fk('toe' + s)
      setBone('toe' + s, _q.identity())
      out.feet[i].set(ball.x + 0.03, 0, z)
      out.heels[i].set(ankle.x - 0.03, 0, z)
      out.balls[i].copy(ball)
      out.stance[i] = f.stance
      out[s === 'L' ? 'kneeL' : 'kneeR'] = { knee, hip, ankle, stance: f.stance, u: f.u }
    })
    // the root bone sits under the rig group; its parent is the GLTF scene root (identity)
    bones.hips.position.copy(Pw.hips).applyQuaternion(QcInv)
    out.x = x; out.bx = bx; out.phi = phi; out.head = Pw.head
    return out
  }
  out.balls = [new THREE.Vector3(), new THREE.Vector3()]; out.stance = [false, false]
  // the phase of the cycle (0..1); both feet are planted for phase 0..0.2 and 0.5..0.7 at duty 0.7
  const phase = (t) => ((t / T) % 1 + 1) % 1
  return { group, boulder, glints, mesh, bones, Pw, update, rootX, phase, R, T, duty: d, lengths: { Lt, Ls, La, Lf, hipH } }
}
