import App from './App.jsx'
import NotFound from './chrome/NotFound.jsx'

/*
  The two prerendered pages: '/' (home) and '/404'. There is no router.
  scripts/prerender.mjs writes data-page on #root so the client hydrates
  the same tree it was served.
*/
export default function Root({ page = 'home' }) {
  return page === '404' ? <NotFound /> : <App />
}
