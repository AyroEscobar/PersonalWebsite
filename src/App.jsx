import Navbar from "./components/Navbar"
import { Outlet } from 'react-router-dom'


function App() {
  return (
    <div className="min-h-screen w-full flex flex-col ">
    <div className="bg-red-500 text-yellow-300 p-8">TEST TAILWIND</div>
      
      <Navbar/>
      <Outlet/>
    </div>
  )
}

export default App