import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import { Outlet } from 'react-router-dom'

function App() {
  const [cursor, setCursor] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const move = (e) => setCursor({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return (
    <div className="min-h-screen w-full flex flex-col relative">
      {/* Cursor glow — single distinctive element, Brittany Chiang style */}
      <div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity"
        style={{
          background: `radial-gradient(600px at ${cursor.x}px ${cursor.y}px, rgba(100, 255, 218, 0.04), transparent 70%)`,
        }}
      />
      <Navbar />
      <Outlet />
    </div>
  )
}

export default App
