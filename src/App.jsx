import Navbar from "./components/Navbar"
import { Outlet } from 'react-router-dom'


function App() {
  return (
    <div class="min-h-screen w-full bg-red-800 flex flex-col ">
      
   
      <Navbar/>
      <Outlet/>
    </div>
  )
}

export default App