import Navbar from './components/Navbar'
import MusicPlayer from './components/MusicPlayer'
import { Outlet, useLocation } from 'react-router-dom'

function App() {
  const location = useLocation()
  const showPlayer = location.pathname !== '/admin'

  return (
    <div className="min-h-screen w-full flex flex-col relative">
      <Navbar />
      <Outlet />
      {showPlayer && <MusicPlayer />}
    </div>
  )
}

export default App
