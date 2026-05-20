import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef, useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { subscribe } from '../lib/audioBus'

// Random points scattered on a spherical shell.
function shellPoints(count, radius) {
  const arr = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r = radius * (1 + Math.random() * 0.55)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    arr[i * 3 + 2] = r * Math.cos(phi)
  }
  return arr
}

function Rig() {
  const group = useRef()
  const inner = useRef()
  const outer = useRef()
  const dust  = useRef()
  const stars = useMemo(() => shellPoints(280, 2.0), [])

  // Shared analyser from the music player (lazy — null until user interacts).
  const analyserRef = useRef(null)
  const dataRef     = useRef(new Uint8Array(128))

  useEffect(() => subscribe((a) => { analyserRef.current = a }), [])

  useFrame((_, d) => {
    const dt = Math.min(d, 0.05)

    // Auto-spin the meshes — keeps it alive when no one is touching it.
    if (inner.current) inner.current.rotation.y += dt * 0.16
    if (outer.current) {
      outer.current.rotation.y -= dt * 0.08
      outer.current.rotation.x += dt * 0.03
    }
    if (dust.current) dust.current.rotation.y += dt * 0.04

    // Audio reactivity — pulse the whole group on bass, jitter outer shell on mids.
    let bass = 0, mid = 0
    if (analyserRef.current) {
      analyserRef.current.getByteFrequencyData(dataRef.current)
      const data = dataRef.current
      bass = (data[1] + data[2] + data[3] + data[4] + data[5]) / 5 / 255
      mid  = (data[14] + data[15] + data[16] + data[17]) / 4 / 255
    }

    if (group.current) {
      const s = 1 + bass * 0.18
      group.current.scale.set(s, s, s)
    }
    if (outer.current) {
      const s = 1.34 + mid * 0.22
      outer.current.scale.set(s, s, s)
    }
  })

  return (
    <group ref={group} rotation={[0.4, 0, 0.15]}>
      <mesh ref={inner}>
        <icosahedronGeometry args={[1.5, 2]} />
        <meshBasicMaterial color="#6dd5ff" wireframe transparent opacity={0.5} />
      </mesh>
      <mesh ref={outer} scale={1.34}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshBasicMaterial color="#2b3447" wireframe transparent opacity={0.75} />
      </mesh>
      <points ref={dust}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.024}
          color="#6dd5ff"
          transparent
          opacity={0.7}
          sizeAttenuation
        />
      </points>
    </group>
  )
}

export default function Globe() {
  const [pings, setPings] = useState([])
  const downRef = useRef(null)

  // Distinguish click from drag — only fire ping if the mouse barely moved.
  const onMouseDown = (e) => {
    downRef.current = { x: e.clientX, y: e.clientY }
  }
  const onMouseUp = (e) => {
    const d = downRef.current
    downRef.current = null
    if (!d) return
    const dist = Math.hypot(e.clientX - d.x, e.clientY - d.y)
    if (dist < 6) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      setPings((arr) => [...arr, id])
      setTimeout(() => setPings((arr) => arr.filter((x) => x !== id)), 1400)
    }
  }

  return (
    <div
      className="relative w-full h-full"
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      role="img"
      aria-label="Interactive operator globe — drag to rotate, click to ping"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent', cursor: 'grab' }}
      >
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.7}
        />
        <Rig />
      </Canvas>

      {/* Sonar ping ripple — fires from the globe's center on click */}
      <div className="absolute inset-0 pointer-events-none">
        <AnimatePresence>
          {pings.map((id) => (
            <motion.div
              key={id}
              initial={{ scale: 0.18, opacity: 0.7 }}
              animate={{ scale: 6, opacity: 0 }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: 100, height: 100,
                marginLeft: -50, marginTop: -50,
                borderRadius: '50%',
                border: '1.5px solid #6ee7a3',
                boxShadow: '0 0 20px rgba(110,231,163,0.35)',
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
