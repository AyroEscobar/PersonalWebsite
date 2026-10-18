/*
  The man: a real human body (assets/figure/man.glb, built by tools/build-figure.mjs from the
  CC-BY 3.0 "Male base" mesh by Артур Мигранов, auto-rigged with 21 joints) driven by a push
  solver on its bones. Everything is solved in the slope frame: ground is y = 0, uphill is +x,
  his right is +z. The caller rotates the group by the slope angle.

    const fig = await loadFigure(url)            // fetch + decode the GLB (meshopt)
    const f = makeFigure({ man: fig, material, boulderMaterial, boulderGeometry, R })
    f.update(tau, pose)      // the push; tau is the gait clock (frozen during the catch)
    f.walk(s, { amp })       // the loop's walk back down (amp 0: standing); f.setMirror(on) turns him
    f.capture(buf), f.blend(a, b, k)   // a pose's bones, and a per-bone mix of two (the loop's turns)

  The body, as a solver:
    - root speed v, step period T, stance duty d. A stance foot is pinned at its footfall; the
      foot is rigid (ankle, ball, toe in one frame) and in the last part of stance the heel rises
      about the planted ball, so the rear leg straightens into the push-off. Feet never slide:
      footfall k lands at root(t_k) + const.
    - the swing is solved in joint space: the thigh swings from its toe-off angle to its landing
      angle (front loaded, with a forward drive, so the knee drives through), the shin trails it and
      the toe clears the slope by bisection. The knee rides an arc of the thigh's length about the
      hip, so it never drops to the slope: no frame of the cycle reads as a kneel.
    - the pelvis sits at 0.84 of the standing hip height (the vase's long lunge) and bobs 2 cm at
      twice the step rate; the torso leans about 56 degrees off the slope's normal; the head is raised
      headUp degrees so the painter's profile (the beard, the eye) reads.
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

export function makeFigure({ man, material, boulderMaterial, boulderGeometry, R = 2.1, speed = 0.33, period = 1.9, duty = 0.7, leanDeg = 50, pelvisK = 0.7, handLift = 0, frontK = 0.16, x0 = 0, sole = 0, surface = sphereSurface, swingPow = 0.7, thighDrive = 0.6, clearance = 0.05, pitchDrop = 0.3, headUp = 20 } = {}) {
  const group = new THREE.Group()
  // model space faces +z with its left at +x; the slope frame faces +x with the right at +z
  // body: a group between him and the slope, so the loop can mirror him to walk down (the rock stays out)
  const body = new THREE.Group(); group.add(body)
  const rig = new THREE.Group(); rig.rotation.y = Math.PI / 2; body.add(rig)
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
  const rootX = (t) => x0 + v0 * t
  const footZ = 0.125
  // the push gait, and the walk (the loop's walk back down: upright, 1.3 m/s, the feet landing ahead)
  const PUSH = { v: v0, T, d, front, x0 }
  const WALK = { v: 1.45, T: 1.0, d: 0.62, front: -0.38, x0: 0 }
  function foot(t, phase, out, gp = PUSH) {
    const { v, T, d, front, x0 } = gp
    const k = Math.floor(t / T - phase)
    const u = (t - (k + phase) * T) / T
    const landX = (kk) => x0 + v * (kk + phase) * T - front
    if (u < d) { out.x = landX(k); out.y = 0; out.u = u / d; out.stance = true; return out }
    out.from = landX(k); out.to = landX(k + 1)
    // the swing itself is solved in joint space in update(); x is only a nominal position
    const w = (u - d) / (1 - d)
    out.x = THREE.MathUtils.lerp(out.from, out.to, w); out.y = 0; out.u = w; out.stance = false
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

  // a planted foot: the ball pinned at (bx, ground) with the heel raised by pitch; if the leg cannot reach
  // the ankle, the heel rises about the ball until it can (99.75% of full length, a knee of about 172
  // degrees), so the rear leg straightens and the foot never slides. Solved by bisection, so the heel angle
  // is continuous. Writes ball, ankle, knee and the foot's rotation; returns the pitch
  const reachMax = () => (Lt + Ls) * 0.9975
  function plant(hip, bx, pitch, z, ball, ankle, knee, footQ) {
    ball.set(bx, ballY + sole, z)
    const ankleAt = (pa) => { footQ.setFromAxisAngle(Zv, -pa); return ankle.copy(ballOff).negate().applyQuaternion(footQ).add(ball) }
    if (ankleAt(pitch).distanceTo(hip) > reachMax()) {
      let lo = pitch, hi = 1.35
      for (let k = 0; k < 22; k++) { const mid = (lo + hi) / 2; if (ankleAt(mid).distanceTo(hip) > reachMax()) lo = mid; else hi = mid }
      pitch = hi; ankleAt(pitch)
    }
    ik(hip, ankle, Lt, Ls, poleKnee, knee)
    return pitch
  }

  // ---- the trunk: hips at (x, pelvisY, sway), the spine leaning `lean` (radians) off the slope's normal,
  // the neck and the head turned neckOff and headOff degrees from it (negative is up)
  function trunk(x, pelvisY, sway, lean, roll, neckOff, headOff) {
    const dir = (deg) => new THREE.Vector3(Math.sin(lean + THREE.MathUtils.degToRad(deg)), Math.cos(lean + THREE.MathUtils.degToRad(deg)), 0)
    const sideRef = new THREE.Vector3(0, Math.sin(roll), 1).normalize()
    Pw.hips.set(x, pelvisY, sway)
    aimBone('hips', dir(-14), sideRef, Zv)
    fk('spine'); aimBone('spine', dir(-3), sideRef, Zv)
    fk('chest'); aimBone('chest', dir(4), new THREE.Vector3(0, -Math.sin(roll) * 0.6, 1).normalize(), Zv)
    fk('neck'); aimBone('neck', dir(neckOff), Zv, Zv)
    fk('head'); aimBone('head', dir(headOff), Zv, Zv)
    out.chestY = Pw.chest.y
  }
  // ---- the clavicles: protract (1) rolls the shoulders forward into the push, 0 lets them hang
  function clavicles(protract) {
    for (const s of ['L', 'R']) {
      const k = 'clav' + s
      fk(k)
      const lat = new THREE.Vector3(0, 0, zSide[s]).applyQuaternion(Rw.chest)
      const fwd = new THREE.Vector3(1, 0, 0).applyQuaternion(Rw.chest)
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(Rw.chest)
      const target = lat.clone().multiplyScalar(0.92).addScaledVector(fwd, 0.32 * protract).addScaledVector(up, 0.06 * protract - 0.04 * (1 - protract))
      aimBone(k, target, fwd, X)
      fk('upperArm' + s)
    }
  }
  // ---- one arm to a wrist target, the hand turned by qh
  function arm(s, wrist, pole, qh) {
    const S = Pw['upperArm' + s]
    const el = ik(S, wrist, La, Lf, pole, new THREE.Vector3())
    const ud = el.clone().sub(S).normalize(), fd = wrist.clone().sub(el).normalize()
    // the biceps side: where the forearm goes; fall back to the pole when the arm is straight
    let ref = fd.clone().addScaledVector(ud, -fd.dot(ud))
    if (ref.lengthSq() < 1e-4) ref.copy(pole).negate()
    aimBone('upperArm' + s, ud, ref.normalize(), X)
    fk('foreArm' + s)
    const elbowRot = new THREE.Quaternion().setFromUnitVectors(ud, fd)
    const refT = ref.clone().applyQuaternion(elbowRot)
    // hand first, then share its twist into the forearm so the wrist does not collapse
    const refFull = X.clone().applyQuaternion(qh)
    refFull.addScaledVector(fd, -refFull.dot(fd)).normalize()
    const refF = refT.clone().lerp(refFull, 0.6).normalize()
    aimBone('foreArm' + s, fd, refF, X)
    fk('hand' + s)
    setBone('hand' + s, qh)
  }
  // a hanging hand: the fingers down the forearm's line, the palm to the thigh (the hand's support frame
  // turned so its heel-to-fingertip axis is the forearm and its palm faces in)
  const freeHand = (s, fd, outQ) => frameRot(handAxis[s], handNormal[s], fd, new THREE.Vector3(0, 0, -zSide[s]), outQ)
  // world down in his own frame: the slope frame turned by the slope, and mirrored when he faces downhill
  let slopeA = THREE.MathUtils.degToRad(14), mirrored = false
  const grav = new THREE.Vector3()
  const setGrav = () => grav.set((mirrored ? 1 : -1) * Math.sin(slopeA), -Math.cos(slopeA), 0)
  function setSlope(deg) { slopeA = THREE.MathUtils.degToRad(deg); setGrav() }
  function setMirror(on) { mirrored = on; setGrav() }
  setGrav()
  // the free wrist: hanging under the shoulder (plumb), a little forward, swung by `swing` radians
  function freeWrist(s, swing, out) {
    const S = Pw['upperArm' + s]
    const fwd = new THREE.Vector3(-grav.y, grav.x, 0) // across the plumb line, toward his front
    const l = (La + Lf) * 0.975
    return out.copy(S).addScaledVector(grav, l * Math.cos(swing)).addScaledVector(fwd, l * Math.sin(swing) + 0.04).add(new THREE.Vector3(0, 0, zSide[s] * 0.07))
  }
  const poleFree = { L: new THREE.Vector3(-1, 0.1, -0.3).normalize(), R: new THREE.Vector3(-1, 0.1, 0.3).normalize() }

  // ---- legs and the rigid feet
  function solveLegs() {
    const legs = [['L', fl], ['R', fr]]
    legs.forEach(([s, f], i) => {
      const z = zSide[s] * footZ
      fk('thigh' + s)
      const hip = Pw['thigh' + s]
      const footQ = new THREE.Quaternion(), ankle = new THREE.Vector3(), knee = new THREE.Vector3(), ball = new THREE.Vector3()
      let pitch // heel lift about the ball, radians
      if (f.stance) {
        pitch = plant(hip, f.x, 0.62 * sstep(0.55, 1.0, f.u), z, ball, ankle, knee, footQ)
      } else {
        // the swing in joint space: the thigh swings from its toe-off angle to its landing angle, front
        // loaded and with a forward overshoot (the knee drives through, up and forward), and the shin
        // trails it; both end angles are the planted solutions, so the swing meets them exactly. The knee
        // rides an arc of the thigh's length about the hip, so it can never drop to the slope (in the IK
        // swing it fell to 0.31 m with the shin flat on the ground, and he read as kneeling)
        const p0 = plant(hip, f.from, 0.62, z, ball, ankle, knee, footQ)
        const a0 = Math.atan2(knee.y - hip.y, knee.x - hip.x), b0 = Math.atan2(ankle.y - knee.y, ankle.x - knee.x), kz0 = knee.z, az0 = ankle.z
        plant(hip, f.to, 0, z, ball, ankle, knee, footQ)
        const a1 = Math.atan2(knee.y - hip.y, knee.x - hip.x), b1 = Math.atan2(ankle.y - knee.y, ankle.x - knee.x), kz1 = knee.z, az1 = ankle.z
        const w = f.u, wt = Math.pow(w, swingPow), et = wt * wt * (3 - 2 * wt), es = w * w * (3 - 2 * w)
        const a = a0 + (a1 - a0) * et + f.drive * Math.sin(Math.PI * Math.pow(w, 0.8))
        let b = b0 + (b1 - b0) * es
        // the heel comes down over the first pitchDrop of the swing (at 0.45 the rear shin flattened to 20 degrees)
        pitch = p0 * (1 - sstep(0.0, pitchDrop, w)) - 0.12 * Math.sin(Math.PI * sstep(0.3, 1.0, w))
        knee.set(hip.x + Lt * Math.cos(a), hip.y + Lt * Math.sin(a), kz0 + (kz1 - kz0) * es)
        const place = (bb) => {
          ankle.set(knee.x + Ls * Math.cos(bb), knee.y + Ls * Math.sin(bb), az0 + (az1 - az0) * es)
          footQ.setFromAxisAngle(Zv, -pitch)
          ball.copy(ballOff).applyQuaternion(footQ).add(ankle)
          return ball.y
        }
        // the toe clears the slope: if the trailing shin would put the ball under it, the heel comes up
        const clear = ballY + sole + clearance * Math.sin(Math.PI * w)
        if (place(b) < clear) {
          const dir = Math.cos(b) < 0 ? -1 : 1 // rotate away from straight down, toward the side the foot is on
          let lo = 0, hi = 1.2
          for (let k = 0; k < 20; k++) { const mid = (lo + hi) / 2; if (place(b + dir * mid) < clear) lo = mid; else hi = mid }
          b += dir * hi; place(b)
        }
      }
      out.pitch[i] = pitch
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
  }

  // ---- the push. pose: shift (m he has been put back), leanAdd, crouch, reachAdd, lookUp (degrees), and
  // for the loop: rock { x, z } (the rock goes its own way instead of sitting in his hands) and release
  // (0..1, his hands come off it and hang)
  function update(t, { shift = 0, leanAdd = 0, crouch = 0, reachAdd = 0, lookUp = 0, rock = null, release = 0 } = {}) {
    const x = rootX(t) - shift
    foot(t, 0, fl); foot(t, 0.5, fr)
    fl.x -= shift; fr.x -= shift
    if (!fl.stance) { fl.from -= shift; fl.to -= shift }
    if (!fr.stance) { fr.from -= shift; fr.to -= shift }
    fl.drive = fr.drive = thighDrive
    const ph = t / T
    const bob = 0.02 * Math.cos(2 * Math.PI * ph * 2)
    const pelvisY = hipH * pelvisK + bob - crouch + sole
    // weight: a 3 degree torso pitch with the step, a little hip roll and sway toward the stance side
    const lean = THREE.MathUtils.degToRad(leanDeg + leanAdd + 1.5 * Math.sin(2 * Math.PI * ph * 2))
    const roll = 0.05 * Math.sin(2 * Math.PI * ph), sway = 0.015 * Math.sin(2 * Math.PI * ph)
    // push-off pulse: a Gaussian at the end of each stance
    const pu = (u) => Math.exp(-(((u - 0.92) / 0.08) ** 2))
    const pl = fl.stance ? pu(fl.u) : 0, pr = fr.stance ? pu(fr.u) : 0
    out.push = Math.max(pl, pr); out.pushFoot = pl >= pr ? 0 : 1

    // ---- the trunk; the head bows toward the rock with the effort, steady against the step (counter-
    // pitch); raised enough that the face, the beard and the eye read in profile (lookUp raises it further)
    trunk(x, pelvisY, sway, lean, roll, -12 - headUp * 0.4, -4 - headUp - lookUp - 1.5 * Math.sin(2 * Math.PI * ph * 2) * 0.6)
    clavicles(1 - 0.7 * release)

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
    const bx = rock ? rock.x : sh.x + reachH + hw
    const phi = Math.asin(THREE.MathUtils.clamp((R - handY) / RR, -1, 1))
    boulder.position.set(bx, R, rock ? rock.z || 0 : 0)
    boulder.rotation.set(0, 0, -bx / R)

    // ---- arms and hands
    // the rock's local frame this instant (it has rolled -bx / R about z)
    const toRock = _qr.setFromAxisAngle(Zv, bx / R), fromRock = _qr2.copy(toRock).invert()
    for (const s of ['L', 'R']) {
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
      // the hand's support plane (bind pose, model space, mirrored for the right) lands on the rock
      const qh = frameRot(handAxis[s], handNormal[s], fingers, palm, new THREE.Quaternion())
      if (release > 0) {
        // the hands come off the rock and hang: the wrist target, the elbow pole and the hand's turn blend
        const k = sstep(0, 1, release)
        const fw = freeWrist(s, 0.15 * (1 - k), new THREE.Vector3())
        wrist.lerp(fw, k)
        const pole = poleArm[s].clone().lerp(poleFree[s], k).normalize()
        const fd = wrist.clone().sub(Pw['upperArm' + s]).normalize()
        qh.slerp(freeHand(s, fd, new THREE.Quaternion()), k)
        arm(s, wrist, pole, qh)
      } else arm(s, wrist, poleArm[s], qh)
    }

    solveLegs()
    out.x = x; out.bx = bx; out.phi = phi; out.head = Pw.head
    return out
  }

  // ---- the walk (and, at amp 0, standing): upright, the arms swinging, he walks +x in the body's own
  // frame (the loop mirrors the body so +x is downhill). s is the distance walked from x = 0
  function walk(s, { amp = 1, lookDown = 0 } = {}) {
    const tc = s / WALK.v
    const ph = tc / WALK.T
    if (amp > 0.001) {
      foot(tc, 0, fl, WALK); foot(tc, 0.5, fr, WALK)
    } else {
      // standing: the feet planted under him, one a short step ahead
      Object.assign(fl, { x: s - 0.1, y: 0, u: 0.2, stance: true }); Object.assign(fr, { x: s + 0.16, y: 0, u: 0.2, stance: true })
    }
    fl.drive = fr.drive = 0.25
    const bob = 0.025 * Math.cos(2 * Math.PI * ph * 2) * amp
    const pelvisY = hipH * 0.95 + bob + sole
    // upright to the world, not to the slope: 4 degrees forward of plumb walking, 2 standing
    const lean = THREE.MathUtils.degToRad(2 + 2 * amp) + (mirrored ? -slopeA : slopeA)
    const roll = 0.04 * Math.sin(2 * Math.PI * ph) * amp, sway = 0.012 * Math.sin(2 * Math.PI * ph) * amp
    trunk(s, pelvisY, sway, lean, roll, -2 + lookDown * 0.4, 4 + lookDown)
    clavicles(0)
    // the arms swing against the legs
    const sw = 0.32 * amp * Math.sin(2 * Math.PI * ph)
    for (const side of ['L', 'R']) {
      const a = side === 'L' ? sw : -sw
      const wrist = freeWrist(side, a, new THREE.Vector3())
      const fd = wrist.clone().sub(Pw['upperArm' + side]).normalize()
      arm(side, wrist, poleFree[side], freeHand(side, fd, new THREE.Quaternion()))
    }
    out.push = 0
    solveLegs()
    out.x = s; out.head = Pw.head
    return out
  }

  // ---- pose blending: capture the bones (local rotations and the root's position), then mix two captures
  const boneList = mesh.skeleton.bones
  const capture = (buf = { q: boneList.map(() => new THREE.Quaternion()), p: new THREE.Vector3() }) => {
    boneList.forEach((b, i) => buf.q[i].copy(b.quaternion)); buf.p.copy(bones.hips.position); return buf
  }
  const blend = (a, b, k) => { boneList.forEach((bn, i) => bn.quaternion.slerpQuaternions(a.q[i], b.q[i], k)); bones.hips.position.lerpVectors(a.p, b.p, k) }
  // the rock on its own (the loop): x along the slope, rolling true
  const placeRock = (x, z = 0) => { boulder.position.set(x, R, z); boulder.rotation.set(0, 0, -x / R) }

  out.balls = [new THREE.Vector3(), new THREE.Vector3()]; out.stance = [false, false]
  // the phase of the cycle (0..1); both feet are planted for phase 0..0.2 and 0.5..0.7 at duty 0.7
  const phase = (t) => ((t / T) % 1 + 1) % 1
  return { group, body, boulder, glints, mesh, bones, Pw, update, walk, capture, blend, placeRock, setSlope, setMirror, rootX, phase, R, T, duty: d, PUSH, WALK, lengths: { Lt, Ls, La, Lf, hipH } }
}
