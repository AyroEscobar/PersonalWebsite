import App from './App.jsx'

/*
  The two prerendered pages: '/' (home) and '/404'. There is no router.
  scripts/prerender.mjs writes data-page on #root so the client hydrates
  the same tree it was served.

  The 404 is its own chunk (r1 M23): the prerender passes NotFound in, and
  the client loads it before hydrating /404 only, so the home page never
  downloads it.
*/
export default function Root({ page = 'home', NotFound = null }) {
  return page === '404' && NotFound ? <NotFound /> : <App />
}
