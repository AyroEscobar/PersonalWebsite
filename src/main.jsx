import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter, createBrowserRouter, RouterProvider } from "react-router-dom";
import About from './components/pages/about.jsx';
import Home from './components/pages/home.jsx';

// In your main file
const router = createBrowserRouter([
 {
   path: "/",
   element: <App />, // App contains Navbar
   children: [
     {path: "/", element: <Home />},
     {path: "/about", element: <About />},
   ]
 }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <RouterProvider router= {router}/>
  </StrictMode>,
)
