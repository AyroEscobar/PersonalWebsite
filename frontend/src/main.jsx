import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './styles/index.css'
import Root from './Root.jsx'
import { initClient } from './lib/client.js'

const el = document.getElementById('root')
// Prerendered pages carry data-page. In `vite dev`, /kit is the kit and any other path but / is the 404.
const devPage = () => (window.location.pathname.replace(/\/$/, '') === '/kit' ? 'kit' : window.location.pathname !== '/' ? '404' : 'home')
const page = el.dataset.page || (import.meta.env.DEV ? devPage() : 'home')

async function start() {
  // The 404 and the kit are separate chunks, loaded before hydrating so the tree matches.
  const NotFound = page === '404' ? (await import('./chrome/NotFound.jsx')).default : null
  const Kit = page === 'kit' ? (await import('./kit/Kit.jsx')).default : null
  const tree = (
    <StrictMode>
      <Root page={page} NotFound={NotFound} Kit={Kit} />
    </StrictMode>
  )
  if (el.hasChildNodes()) hydrateRoot(el, tree)
  else createRoot(el).render(tree)
  initClient()
}

start()
