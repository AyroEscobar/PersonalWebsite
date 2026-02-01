// Hero Section - Premium 3D animated intro

import { useRef, useState, useEffect, Suspense, lazy } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import * as random from 'maath/random/dist/maath-random.esm'
import { FaLinkedin, FaGithub, FaInstagram } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'

// Optimized particle field - fewer particles for performance
function StarField(props) {
  const ref = useRef()
  const [sphere] = useState(() => random.inSphere(new Float32Array(1500), { radius: 1.2 }))

  useFrame((state, delta) => {
    ref.current.rotation.x -= delta / 20
    ref.current.rotation.y -= delta / 25
  })

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#38bdf8"
          size={0.0015}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.8}
        />
      </Points>
    </group>
  )
}

// Subtle floating shapes
function FloatingShape({ position, color, speed = 1, size = 0.12 }) {
  const meshRef = useRef()

  useFrame((state) => {
    meshRef.current.rotation.x = state.clock.elapsedTime * 0.2 * speed
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.15 * speed
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.08
  })

  return (
    <mesh ref={meshRef} position={position}>
      <octahedronGeometry args={[size, 0]} />
      <meshStandardMaterial color={color} wireframe transparent opacity={0.4} />
    </mesh>
  )
}

// 3D Scene component
function Scene() {
  return (
    <>
      <StarField />
      <FloatingShape position={[-1.2, 0.4, -0.2]} color="#38bdf8" speed={0.7} size={0.1} />
      <FloatingShape position={[1.3, -0.2, -0.1]} color="#a855f7" speed={0.9} size={0.08} />
      <FloatingShape position={[0.6, 0.6, -0.4]} color="#22d3d1" speed={0.8} size={0.06} />
      <FloatingShape position={[-0.7, -0.5, -0.3]} color="#f472b6" speed={0.6} size={0.07} />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.3} />
    </>
  )
}

function Hero() {
  const titles = [
    "MLH Coach",
    "GitHub Campus Expert",
    "Hackathon Organizer",
    "Software Engineer"
  ]

  const [titleIndex, setTitleIndex] = useState(0)
  const [is3DReady, setIs3DReady] = useState(false)

  // Delay 3D loading for faster initial paint
  useEffect(() => {
    const timer = setTimeout(() => setIs3DReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Cycle through titles
  useEffect(() => {
    const interval = setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % titles.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <section id="hero" className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* 3D Background - lazy loaded */}
      <div className="absolute inset-0">
        {is3DReady && (
          <Canvas
            camera={{ position: [0, 0, 1], fov: 75 }}
            dpr={[1, 1.5]} // Limit pixel ratio for performance
            performance={{ min: 0.5 }}
          >
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </Canvas>
        )}
      </div>

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B42]/60 via-transparent to-[#0B0B42]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B42]/40 via-transparent to-[#0B0B42]/40" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Greeting */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-white/50 text-sm md:text-base tracking-[0.3em] uppercase mb-4"
        >
          Welcome
        </motion.p>

        {/* Name with gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight"
        >
          <span className="text-white">Ayro </span>
          <span className="gradient-text">Escobar</span>
        </motion.h1>

        {/* Rotating titles */}
        <div className="h-10 md:h-12 mb-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={titleIndex}
              initial={{ opacity: 0, y: 15, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -15, filter: "blur(10px)" }}
              transition={{ duration: 0.4 }}
              className="text-xl md:text-2xl lg:text-3xl text-sky-400 font-medium"
            >
              {titles[titleIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-base md:text-lg text-white/60 max-w-lg mx-auto mb-10 leading-relaxed"
        >
          Building cool stuff and helping others do the same.
        </motion.p>

        {/* Social links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex justify-center items-center gap-5"
        >
          {[
            { href: "https://www.linkedin.com/in/ayroescobar/", icon: FaLinkedin, hoverColor: "hover:text-blue-400", label: "LinkedIn" },
            { href: "https://github.com/AyroEscobar", icon: FaGithub, hoverColor: "hover:text-white", label: "GitHub" },
            { href: "mailto:yro.escobar@gmail.com", icon: MdEmail, hoverColor: "hover:text-red-400", label: "Email" },
            { href: "https://www.instagram.com/ayro.afk/", icon: FaInstagram, hoverColor: "hover:text-pink-400", label: "Instagram" },
          ].map((social, i) => (
            <motion.a
              key={social.label}
              href={social.href}
              target={social.href.startsWith("mailto") ? undefined : "_blank"}
              rel="noopener noreferrer"
              aria-label={social.label}
              whileHover={{ scale: 1.15, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`text-white/40 ${social.hoverColor} transition-colors duration-300 p-2`}
            >
              <social.icon size={24} />
            </motion.a>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-white/30 text-xs tracking-widest uppercase">Scroll</span>
            <div className="w-5 h-8 border border-white/20 rounded-full flex justify-center pt-1.5">
              <motion.div
                animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="w-1 h-2 bg-white/40 rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero
