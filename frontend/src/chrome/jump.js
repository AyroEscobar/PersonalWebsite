import { useSyncExternalStore } from 'react'
import { STORAGE } from '../content/constants.js'
import { afterLoad, onIdle } from '../lib/idle.js'

/*
  JumpList controller (B, PLAN.md 4.6). Small and eager; the list itself is a
  lazy chunk (JumpList.jsx).

    openJump({ instant, opener })   open it; instant skips the entrance (keyboard)
    closeJump()                     close it, focus goes back to whoever opened it
    toggleJump(opts)
    useJumpMounted()                true once the chunk should be on the page
    installShortcuts()              Cmd+K and Ctrl+K anywhere; '/' unless turned off
    shortcutsOn() / setShortcuts(on)    the per-viewer switch for single-key shortcuts (WCAG 2.1.4)
    prefetchJump()                  warm the chunk

  Once mounted, the list stays mounted with its <dialog> closed, so every
  open after the first is synchronous. On a phone that matters: the input
  has to be focused inside the tap for iOS to raise the keyboard. The list
  is mounted on idle after load, so even the first tap is usually synchronous.
*/

let mounted = false
let api = null
let pending = null
const readers = new Set()

const notify = () => readers.forEach((fn) => fn())

function mount() {
  if (mounted) return
  mounted = true
  notify()
}

export function useJumpMounted() {
  return useSyncExternalStore(
    (fn) => {
      readers.add(fn)
      return () => readers.delete(fn)
    },
    () => mounted,
    () => false,
  )
}

let chunk = null
export function prefetchJump() {
  if (!chunk) chunk = import('./JumpList.jsx').catch(() => (chunk = null))
  return chunk
}

/** Called by JumpList on mount and unmount. */
export function registerJump(handle) {
  api = handle
  if (api && pending) {
    const p = pending
    pending = null
    api.open(p)
  }
  return () => {
    if (api === handle) api = null
  }
}

export function openJump({ instant = false, opener } = {}) {
  const opts = { instant, opener: opener ?? (typeof document !== 'undefined' ? document.activeElement : null) }
  if (api) return api.open(opts)
  pending = opts
  prefetchJump()
  mount()
}

export function closeJump() {
  api?.close()
}

export function toggleJump(opts) {
  if (api?.isOpen()) closeJump()
  else openJump(opts)
}

// ---------- single-key shortcuts switch (WCAG 2.1.4) ----------

export function shortcutsOn() {
  try {
    return window.localStorage.getItem(STORAGE.shortcuts) !== 'off'
  } catch {
    return true
  }
}

export function setShortcuts(on) {
  try {
    if (on) window.localStorage.removeItem(STORAGE.shortcuts)
    else window.localStorage.setItem(STORAGE.shortcuts, 'off')
  } catch {
    /* storage blocked: the setting lasts for this page */
  }
  memo = on
}
let memo = null
const singleKeysOn = () => (memo == null ? (memo = shortcutsOn()) : memo)

const typing = (el) =>
  !!el && (el.isContentEditable || /^(input|textarea|select)$/i.test(el.tagName) || el.getAttribute?.('role') === 'combobox')

let installed = false
export function installShortcuts() {
  if (installed || typeof window === 'undefined') return () => {}
  installed = true
  const onKey = (e) => {
    if (e.defaultPrevented || e.isComposing) return
    const mod = e.metaKey || e.ctrlKey
    if (mod && !e.altKey && !e.shiftKey && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault()
      toggleJump({ instant: true })
      return
    }
    // The first Meta or Ctrl press is a strong hint: warm the chunk.
    if (e.key === 'Meta' || e.key === 'Control') {
      prefetchJump()
      mount()
      return
    }
    if (e.key === '/' && !mod && !e.altKey && singleKeysOn() && !typing(e.target)) {
      e.preventDefault()
      openJump({ instant: true })
    }
  }
  window.addEventListener('keydown', onKey)

  // Mount on the first idle moment after load, so the first open is instant too.
  let cancel = () => {}
  afterLoad().then(() => {
    cancel = onIdle(() => {
      prefetchJump()
      mount()
    }, 3000)
  })
  return () => {
    installed = false
    cancel()
    window.removeEventListener('keydown', onKey)
  }
}
