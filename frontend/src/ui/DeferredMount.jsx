import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import ErrorBoundary from './ErrorBoundary.jsx'
import { useHydrated } from '../lib/hydrated.js'
import { useStore } from '../lib/store.js'
import { afterLoad, onIdle } from '../lib/idle.js'

/*
  The lazy boundary for anything heavy (PLAN.md 7). Whatever sits behind it
  is split into its own chunk and never reaches the entry bundle:
  GridCanvas and PingWave (raw WebGL2), the JumpList, the specimens.
  There is no three.js anywhere; scripts/budget.mjs fails the build if
  `WebGLRenderer` or any three/R3F code shows up in dist.

    <DeferredMount
      load={() => import('../grid/GridCanvas.jsx')}  a dynamic import, written at the call site
      tiers={['full', 'lite']}   mount only on these render tiers (default: all three)
      when="load"                'load'    after window load, then idle (default)
                                 'visible' when the wrapper nears the viewport
                                 'idle'    first idle moment after hydration
                                 'now'     right after hydration
      rootMargin="300px 0px"     for when="visible"
      prefetch                   warm the chunk on idle after load, even before mounting
      fallback={<Poster />}      shown until the chunk renders, and if it fails
      as="div" className="..."   the wrapper element (it is also the visibility anchor)
      props={{ ... }}            passed to the lazy component
      onError={(err) => {}}      e.g. markWebGLUnavailable()
    />

  Nothing mounts on the server or during hydration, so the prerendered HTML
  holds only the fallback, and reduced motion or quiet mode (tier 'static')
  never downloads a WebGL chunk.
*/
export default function DeferredMount({
  load,
  tiers = ['full', 'lite', 'static'],
  when = 'load',
  rootMargin = '300px 0px',
  prefetch = false,
  fallback = null,
  as: As = 'div',
  className,
  props,
  onError,
  ...rest
}) {
  const hydrated = useHydrated()
  const tier = useStore((s) => s.tier)
  const allowed = hydrated && tiers.includes(tier)
  const [ready, setReady] = useState(false)
  const [Lazy] = useState(() => lazy(load))
  const ref = useRef(null)

  useEffect(() => {
    if (!allowed || ready) return
    let cancelled = false
    let cancelIdle = () => {}
    let io
    const go = () => !cancelled && setReady(true)
    if (when === 'now') go()
    else if (when === 'idle') cancelIdle = onIdle(go)
    else if (when === 'visible') {
      if (typeof IntersectionObserver === 'undefined' || !ref.current) go()
      else {
        io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && go(), { rootMargin })
        io.observe(ref.current)
      }
    } else afterLoad().then(() => (cancelIdle = onIdle(go)))
    return () => {
      cancelled = true
      cancelIdle()
      io?.disconnect()
    }
  }, [allowed, ready, when, rootMargin])

  useEffect(() => {
    if (!prefetch || !allowed) return
    let cancel = () => {}
    afterLoad().then(() => (cancel = onIdle(() => load().catch(() => {}))))
    return () => cancel()
    // load is a fresh arrow each render; prefetch once per tier change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefetch, allowed])

  return (
    <As ref={ref} className={className} {...rest}>
      {ready && allowed ? (
        <ErrorBoundary fallback={fallback} onError={onError}>
          <Suspense fallback={fallback}>
            <Lazy {...props} />
          </Suspense>
        </ErrorBoundary>
      ) : (
        fallback
      )}
    </As>
  )
}
