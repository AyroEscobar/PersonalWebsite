import App from './App.jsx'

/*
  The prerendered pages: '/' (home), '/kit' (the component kit) and '/404'.
  There is no router. scripts/prerender.mjs writes data-page on #root so the
  client hydrates the same tree it was served.

  The 404 and the kit are their own chunks: the prerender passes them in,
  and the client loads the one it needs before hydrating, so the home page
  never downloads either.
*/
export default function Root({ page = 'home', NotFound = null, Kit = null }) {
  if (page === '404' && NotFound) return <NotFound />
  if (page === 'kit' && Kit) return <Kit />
  return <App />
}
