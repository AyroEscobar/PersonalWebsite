import Navbar from "./components/Navbar"
import pfpImage from './assets/pfp.JPG';

function App() {
  return (
    <div className="min-h-screen w-full bg-red-800 flex flex-col">
      <h1 className="text-4xl font-bold text-blue-600">
        brooooo
      </h1>
      <div>
        <img className="w-[5rem] h-[5rem] object-cover rounded-full" src = {pfpImage} alt = "Profile Image"/>
      </div>
      <Navbar/>
    </div>
  )
}

export default App