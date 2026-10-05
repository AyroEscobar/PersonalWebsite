import { StrictMode } from 'react'
import { prerenderToNodeStream } from 'react-dom/static'
import Root from './Root.jsx'
import NotFound from './chrome/NotFound.jsx'
import Kit from './kit/Kit.jsx'
import './styles/index.css'

/*
  Prerender entry. scripts/prerender.mjs calls render() for '/', '/kit'
  and '/404' after the client build and injects the HTML into the built
  index.html. Everything that depends on the browser renders its
  placeholder here (see src/lib/hydrated.js), so hydration matches.
*/
export async function render(page = 'home') {
  const { prelude } = await prerenderToNodeStream(
    <StrictMode>
      <Root page={page} NotFound={NotFound} Kit={Kit} />
    </StrictMode>,
  )
  let html = ''
  for await (const chunk of prelude) html += chunk
  return html
}
