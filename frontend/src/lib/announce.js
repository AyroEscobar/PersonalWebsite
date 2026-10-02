/*
  Polite announcements for user-triggered results only (PLAN.md 8):
  "pinged from plano", "email copied", the JumpList result count.
  Never for clocks or anything that changes on its own.

    announce('email copied')                         page channel, immediate
    announce('pinged from plano', { debounce: 1000 })
    announce('4 results', { channel: 'jump', debounce: 300 })   inside the JumpList dialog

  Render <Announcer /> once (App does) and <Announcer channel="jump" />
  inside any modal dialog, because content outside a modal is inert.
*/
const channels = new Map()
const timers = new Map()

export function register(channel, setText) {
  channels.set(channel, setText)
  return () => {
    if (channels.get(channel) === setText) channels.delete(channel)
  }
}

export function announce(text, { channel = 'page', debounce = 0 } = {}) {
  const fire = () => {
    const set = channels.get(channel)
    if (!set) return
    // Clear first so the same message twice is announced twice.
    set('')
    window.setTimeout(() => set(text), 30)
  }
  window.clearTimeout(timers.get(channel))
  if (debounce > 0) timers.set(channel, window.setTimeout(fire, debounce))
  else fire()
}
