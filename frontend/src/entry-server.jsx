import { StrictMode } from 'react'
import { prerenderToNodeStream } from 'react-dom/static'
import Root from './Root.jsx'
import './styles/index.css'

/*
  Prerender entry (PLAN.md 7, 11). scripts/prerender.mjs calls render() for
  '/' and '/404' after the client build and injects the HTML into the built
  index.html. Everything that depends on the browser renders its placeholder
  here (see src/lib/hydrated.js), so hydration matches.
*/
export async function render(page = 'home') {
  const { prelude } = await prerenderToNodeStream(
    <StrictMode>
      <Root page={page} />
    </StrictMode>,
  )
  let html = ''
  for await (const chunk of prelude) html += chunk
  return html
}
