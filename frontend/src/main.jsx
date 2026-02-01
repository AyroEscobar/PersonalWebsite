import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from './components/pages/home.jsx';
import HackathonMap from './components/pages/projects.jsx';
import Review from './components/pages/Review.jsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/hackathons", element: <HackathonMap /> },
      { path: "/review", element: <Review /> },
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <RouterProvider router= {router}/>
  </StrictMode>,
)
