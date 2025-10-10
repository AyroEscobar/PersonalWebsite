import React from 'react'
import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-11/12 max-w-4xl bg-slate-800/90 backdrop-blur-sm shadow-xl rounded-2xl px-8 py-4">
      <div className="flex items-center justify-evenly w-full">
        <Link 
          to="/" 
          className="px-4 py-2 text-white font-semibold text-xl hover:text-sky-300 transition duration-300"
        >
          Home
        </Link>
        
        <Link 
          to="/about" 
          className="px-4 py-2 text-white font-medium hover:text-sky-300 hover:bg-slate-700 rounded-lg transition duration-300"
        >
          About
        </Link>
        <Link
          to="/leadership"
          className="px-4 py-2 text-white font-medium hover:text-sky-300 hover:bg-slate-700 rounded-lg transition duration-300"
        >
          Leadership
        </Link>
        <Link
        to = "/projects"
        className="px-4 py-2 text-white font-medium hover:text-sky-300 hover:bg-slate-700 rounded-lg transition duration-300"
        >
        Projects
        </Link>
      </div>
    </nav>
  )
}

export default Navbar