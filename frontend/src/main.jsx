import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Seed script - run seedHackathons() in browser console to populate data
import './scripts/seedHackathons.js'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from './components/pages/home.jsx';
import HackathonMap from './components/pages/projects.jsx';
import Review from './components/pages/Review.jsx';
import Admin from './components/pages/Admin.jsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/hackathons", element: <HackathonMap /> },
      { path: "/review", element: <Review /> },
    ]
  },
  // Admin is standalone - no navbar
  { path: "/admin", element: <Admin /> }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <RouterProvider router= {router}/>
  </StrictMode>,
)
