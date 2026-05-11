import Navbar from './components/Navbar'
import { Outlet } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen w-full flex flex-col relative">
      <Navbar />
      <Outlet />
    </div>
  )
}

export default App
