import Navbar from "./components/Navbar"
import { Outlet } from 'react-router-dom'


function App() {
  return (
    <div className="min-h-screen w-full bg-red-800 flex flex-col">
      <h1 className="text-4xl font-bold text-blue-600">
        brooooo
      </h1>
   
      <Navbar/>
      <Outlet/>
    </div>
  )
}

export default App