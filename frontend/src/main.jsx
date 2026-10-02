import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './styles/index.css'
import Root from './Root.jsx'
import { initClient } from './lib/client.js'

const el = document.getElementById('root')
// Prerendered pages carry data-page. In `vite dev` any path other than / shows the 404.
const page = el.dataset.page || (import.meta.env.DEV && window.location.pathname !== '/' ? '404' : 'home')

async function start() {
  // The 404 is a separate chunk, loaded before hydrating so the tree matches.
  const NotFound = page === '404' ? (await import('./chrome/NotFound.jsx')).default : null
  const tree = (
    <StrictMode>
      <Root page={page} NotFound={NotFound} />
    </StrictMode>
  )
  if (el.hasChildNodes()) hydrateRoot(el, tree)
  else createRoot(el).render(tree)
  initClient()
}

start()
