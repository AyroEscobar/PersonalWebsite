import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'

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
  const inner = useRef()
  const outer = useRef()
  const dust  = useRef()
  const stars = useMemo(() => shellPoints(240, 2.0), [])

  useFrame((_, d) => {
    const dt = Math.min(d, 0.05)
    if (inner.current) inner.current.rotation.y += dt * 0.16
    if (outer.current) {
      outer.current.rotation.y -= dt * 0.08
      outer.current.rotation.x += dt * 0.03
    }
    if (dust.current) dust.current.rotation.y += dt * 0.04
  })

  return (
    <group rotation={[0.4, 0, 0.15]}>
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
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
      aria-hidden="true"
    >
      <Rig />
    </Canvas>
  )
}
