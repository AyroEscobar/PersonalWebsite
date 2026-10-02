import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './styles/index.css'
import Root from './Root.jsx'
import { initClient } from './lib/client.js'

const el = document.getElementById('root')
// Prerendered pages carry data-page. In `vite dev` any path other than / shows the 404.
const page = el.dataset.page || (import.meta.env.DEV && window.location.pathname !== '/' ? '404' : 'home')
const tree = (
  <StrictMode>
    <Root page={page} />
  </StrictMode>
)

if (el.hasChildNodes()) hydrateRoot(el, tree)
else createRoot(el).render(tree)

initClient()
