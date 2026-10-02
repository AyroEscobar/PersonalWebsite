import { useSyncExternalStore } from 'react'

/*
  Hydration-safe client detection. False on the server and during the
  hydration render, true right after. Anything that depends on time, the
  timezone, window, storage, matchMedia or WebGL renders its placeholder
  until this is true, so the prerendered HTML and the first client render
  always match.
*/
const noop = () => () => {}

export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
}
