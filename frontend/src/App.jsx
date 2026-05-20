import { useState, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import BackToTop from './components/BackToTop'
import ScrollProgress from './components/ScrollProgress'
import Boot from './components/Boot'
import MusicPlayer from './components/MusicPlayer'

function App() {
  const location = useLocation()
  const showChrome = location.pathname !== '/admin'

  const [booted, setBooted] = useState(() => {
    try { return sessionStorage.getItem('oc_booted') === '1' } catch { return false }
  })
  const finishBoot = useCallback(() => {
    try { sessionStorage.setItem('oc_booted', '1') } catch { /* sessionStorage unavailable */ }
    setBooted(true)
  }, [])

  return (
    <div className="min-h-screen w-full flex flex-col relative">
      {showChrome && !booted && <Boot onDone={finishBoot} />}
      {showChrome && <ScrollProgress />}
      <Navbar />
      <Outlet />
      {showChrome && <BackToTop />}
      {showChrome && <MusicPlayer />}
    </div>
  )
}

export default App
