import React from 'react'
import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav className = "shadow-lg flex items-center justify-around py=3 px-32 fixed top-0 left-0 w-full">
    <Link to="/">
      <span className = "font-semibold text-lg flex items-center">
        <h1>home</h1>
      </span>
    </Link>

      <div className = "flex items-center gap-5 text-black">
         <Link to="/" className = "py-1 px-3 text-lg font-light text-white hover:text-sky-300 \
         rounded2x1 hover:bg-slate-700 transition duration-300 ">
      <span className = "font-semibold text-lg flex items-center">
        <h1>not home</h1>
      </span>
    </Link>
     <Link to="/about" className = "py-1 px-3 text-lg font-light text-white hover:text-sky-300 \
         rounded2x1 hover: bg-slate-700 transition duration-300 ">
      <span className = "font-semibold text-lg flex items-center">
        <h1>about</h1>
      </span>
    </Link>

      </div>
    </nav>
  )
}

export default Navbar