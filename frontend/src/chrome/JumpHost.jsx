import { lazy, Suspense, useEffect } from 'react'
import ErrorBoundary from '../ui/ErrorBoundary.jsx'
import { installShortcuts, useJumpMounted } from './jump.js'

/*
  Where the JumpList lives (B, PLAN.md 4.6). Renders nothing on the server or
  until the list is wanted (idle after load, the first Meta or Ctrl press, a
  click on search, or a shortcut). Installs Cmd+K, Ctrl+K and '/' once.

    <JumpHost />            on the home page
    <JumpHost base="/" />   on the 404: section results link to "/#id"
*/
const JumpList = lazy(() => import('./JumpList.jsx'))

export default function JumpHost({ base = '' }) {
  const mounted = useJumpMounted()
  useEffect(() => installShortcuts(), [])
  if (!mounted) return null
  return (
    <ErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <JumpList base={base} />
      </Suspense>
    </ErrorBoundary>
  )
}
