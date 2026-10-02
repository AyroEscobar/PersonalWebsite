import { useHydrated } from '../lib/hydrated.js'

/*
  Renders `fallback` on the server and during hydration, then `children`.
  Use it for anything that reads time, storage, matchMedia or the GPU.
    <ClientOnly fallback={CHROME.clockPlaceholder.text}><LocalClock /></ClientOnly>
*/
export default function ClientOnly({ children, fallback = null }) {
  return useHydrated() ? children : fallback
}
