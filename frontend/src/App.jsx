import Navbar from './components/Navbar'
import MusicPlayer from './components/MusicPlayer'
import BackToTop from './components/BackToTop'
import ScrollProgress from './components/ScrollProgress'
import { Outlet, useLocation } from 'react-router-dom'

function App() {
  const location = useLocation()
  const showChrome = location.pathname !== '/admin'

  return (
    <div className="min-h-screen w-full flex flex-col relative">
      {showChrome && <ScrollProgress />}
      <Navbar />
      <Outlet />
      {showChrome && <MusicPlayer />}
      {showChrome && <BackToTop />}
    </div>
  )
}

export default App
