import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { SECTIONS } from '../content/sections.js'
import { WORK } from '../content/work.js'
import { BUILDS } from '../content/builds.js'
import { SIGNAL } from '../content/signal.js'
import { CHROME, JUMP } from '../content/meta.js'
import { EMAIL, REPO, STORAGE } from '../content/constants.js'
import { MAP } from '../content/places.js'
import { announce } from '../lib/announce.js'
import { ping, setMode } from '../lib/store.js'
import { useQuiet } from '../lib/mode.js'
import Announcer from '../ui/Announcer.jsx'
import { registerJump, setShortcuts, shortcutsOn } from './jump.js'
import { goTo, useRoute } from './route.js'

/*
  JumpList (B, PLAN.md 4.6). A lazy chunk. Search over everything on the
  page: the six stops, the roles, the builds, the channels, and a few system
  commands. Plain fuzzy text matching over src/content, not a chatbot.

  A native <dialog> opened with showModal(): top layer, inert page, Esc and
  a focus trap for free. Inside, the WAI-ARIA list autocomplete combobox:
  the input owns aria-activedescendant, results are options in groups.
  Up and Down move and wrap, Enter runs, Esc closes, focus goes back to
  whoever opened it. The result count is announced politely, 300 ms after
  typing stops, from a status region inside the dialog (the page behind
  is inert while it is open).

  Opened from the keyboard it appears instantly: a palette you open many
  times a day should never make you wait for it. Opened by pointer it takes
  a 140 ms fade. Reduced motion: opacity only. Every command here also exists
  as ordinary page content; this is a shortcut, never the only path.
*/

// Search aliases. Never displayed; they only help a query find its stop.
const ALIASES = {
  origin: ['about', 'home', 'top', 'bio', 'hero', 'name'],
  now: ['current', 'currently', 'status', 'today', 'clock', 'time'],
  work: ['experience', 'jobs', 'roles', 'career', 'internships', 'resume'],
  builds: ['projects', 'portfolio', 'code', 'repos', 'apps'],
  crew: ['community', 'hackathons', 'volunteering', 'speaking', 'talks'],
  signal: ['contact', 'email', 'reach', 'message', 'hello', 'socials'],
}

const GROUP_ORDER = ['recent', 'sections', 'roles', 'builds', 'channels', 'commands']
const RECENT_MAX = 4

const host = (href) => href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

function readRecents() {
  try {
    const v = JSON.parse(window.localStorage.getItem(STORAGE.recents) || '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, RECENT_MAX) : []
  } catch {
    return []
  }
}

function pushRecent(id) {
  try {
    const next = [id, ...readRecents().filter((x) => x !== id)].slice(0, RECENT_MAX)
    window.localStorage.setItem(STORAGE.recents, JSON.stringify(next))
  } catch {
    /* storage blocked: no recents, nothing else changes */
  }
}

/*
  The signature from the keyboard (A's B4): a ping from Plano, the same as
  the hero's ping button. On desktop the map is the sticky layer beside the
  reading column, so the wave runs where you are. On phones the map is the
  hero block: the page goes back up to it first, then pings.
*/
function pingFromSearch() {
  const fire = () => {
    ping({ node: 'plano', source: 'jump' })
    announce(MAP.pinged.text)
  }
  const r = document.querySelector('.ng-view')?.getBoundingClientRect()
  if (r && r.height > 0 && r.bottom > 120 && r.top < window.innerHeight - 120) return fire()
  goTo('origin')
  window.setTimeout(fire, document.documentElement.dataset.motion === 'reduced' ? 0 : 700)
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Older browsers and blocked permissions: a hidden textarea and execCommand.
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    ta.remove()
    return ok
  }
}

/*
  Matching. Titles take a fuzzy subsequence: every query character in order,
  scored up for word starts, adjacent runs and a whole-substring hit, and
  rejected when most characters land mid-word and scattered (so "rbc" finds
  RBC Capital Markets, and "mlh" finds Major League Hacking, but neither
  finds an email address). Subtitles and search aliases are stricter: every
  word of the query must begin a word there. Returns null or { score, at }
  with the matched title positions for highlighting.
*/
const WORD_BREAK = /[\s,.·/()@_-]/

function fuzzy(q, text) {
  if (!text) return null
  const t = text.toLowerCase()
  const chars = q.replace(/\s+/g, '')
  const at = []
  let score = 0
  let good = 0
  let from = 0
  let prev = -2
  for (const ch of chars) {
    const i = t.indexOf(ch, from)
    if (i < 0) return null
    const wordStart = i === 0 || WORD_BREAK.test(t[i - 1])
    const run = i === prev + 1
    if (wordStart || run) good++
    score += 1 + (wordStart ? 2.5 : 0) + (run ? 2 : 0) - Math.min(2, (i - from) * 0.05)
    at.push(i)
    prev = i
    from = i + 1
  }
  const flat = q.replace(/\s+/g, ' ').trim()
  const sub = t.indexOf(flat)
  if (sub >= 0) score += 4 + (sub === 0 || WORD_BREAK.test(t[sub - 1]) ? 4 : 0)
  else if (good < Math.ceil(chars.length * 0.75)) return null
  return { score, at }
}

function prefixes(q, text) {
  if (!text) return null
  const words = text.toLowerCase().split(WORD_BREAK).filter(Boolean)
  const parts = q.split(/\s+/).filter(Boolean)
  if (!parts.length || !parts.every((p) => words.some((w) => w.startsWith(p)))) return null
  return { score: 3 + parts.reduce((s, p) => s + p.length, 0) * 0.5 }
}

function match(q, item) {
  const title = fuzzy(q, item.title)
  let best = title ? { score: title.score * 1.25, at: title.at } : null
  for (const s of [item.sub, ...(item.keywords || [])]) {
    const m = prefixes(q, s)
    if (m && (!best || m.score > best.score)) best = { score: m.score, at: title ? title.at : [] }
  }
  return best
}

function Highlight({ text, at }) {
  if (!at?.length) return text
  const set = new Set(at)
  const out = []
  let run = ''
  let lit = false
  for (let i = 0; i < text.length; i++) {
    const on = set.has(i)
    if (on !== lit && run) {
      out.push(lit ? <mark key={i}>{run}</mark> : run)
      run = ''
    }
    lit = on
    run += text[i]
  }
  if (run) out.push(lit ? <mark key="end">{run}</mark> : run)
  return out
}

function Lamp({ kind }) {
  return <span className="jl-lamp" data-kind={kind} aria-hidden="true" />
}

export default function JumpList({ base = '' }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const dialogRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const openerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const [recents, setRecents] = useState([])
  const [keys, setKeys] = useState(true)
  const quiet = useQuiet()
  const { index: here } = useRoute()

  const onHome = !base

  // ---------- the items ----------
  const items = useMemo(() => {
    const go = (id, fallback) => () => {
      if (onHome) {
        if (!goTo(id)) goTo(fallback)
      } else window.location.assign(`${base}#${document.getElementById(id) ? id : fallback}`)
    }
    const nav = (href) => () => window.location.assign(href)
    const list = []

    SECTIONS.forEach((s, i) => {
      list.push({
        id: `sec-${s.id}`,
        group: 'sections',
        title: s.label.text,
        keywords: ALIASES[s.id] || [],
        lamp: onHome && i === here ? 'here' : 'station',
        run: go(s.id, s.id),
      })
    })

    for (const p of WORK.plates) {
      list.push({
        id: `role-${p.id}`,
        group: 'roles',
        title: p.org,
        sub: p.role,
        hint: p.dates,
        keywords: [p.place, ...(p.desks || []).map((d) => d.name)].filter(Boolean),
        lamp: p.state === 'now' ? 'now' : 'past',
        run: go(p.id, 'work'),
      })
    }

    for (const c of BUILDS.cards) {
      list.push({
        id: `build-${c.id}`,
        group: 'builds',
        title: c.title,
        sub: c.meta,
        keywords: [c.stack].filter(Boolean),
        lamp: 'build',
        run: go(c.id, 'builds'),
      })
    }

    list.push({
      id: 'ch-email',
      group: 'channels',
      title: SIGNAL.email.text,
      sub: SIGNAL.write.text,
      keywords: ['email', 'mail', 'write', 'contact'],
      lamp: 'link',
      run: nav(SIGNAL.email.mailto),
    })
    for (const c of SIGNAL.channels) {
      list.push({
        id: `ch-${c.id}`,
        group: 'channels',
        title: c.label,
        sub: host(c.href),
        lamp: 'link',
        run: nav(c.href),
      })
    }

    if (onHome) {
      list.push({
        id: 'cmd-ping',
        group: 'commands',
        title: JUMP.commands.ping.text,
        keywords: ['map', 'wave', 'grid', 'roads', 'highways', 'plano'],
        lamp: 'cmd',
        run: pingFromSearch,
      })
    }

    list.push(
      quiet
        ? {
            id: 'cmd-quiet',
            group: 'commands',
            title: JUMP.commands.quietOff.text,
            keywords: ['motion', 'calm', 'plain', 'effects'],
            lamp: 'cmd',
            run: () => setMode('full'),
            say: JUMP.commands.quietOff.text,
          }
        : {
            id: 'cmd-quiet',
            group: 'commands',
            title: JUMP.commands.quietOn.text,
            keywords: ['motion', 'calm', 'plain', 'recruiter', 'effects'],
            lamp: 'cmd',
            run: () => setMode('quiet'),
            say: JUMP.commands.quietOn.text,
          },
      {
        id: 'cmd-copy',
        group: 'commands',
        title: JUMP.commands.copyEmail.text,
        keywords: ['email', 'mail', 'clipboard', 'contact'],
        lamp: 'cmd',
        run: () => copyText(EMAIL).then((ok) => ok && announce(SIGNAL.copiedStatus.text)),
      },
      {
        id: 'cmd-print',
        group: 'commands',
        title: JUMP.commands.print.text,
        keywords: ['pdf', 'paper', 'resume', 'save'],
        lamp: 'cmd',
        run: () => window.setTimeout(() => window.print(), 80),
      },
      {
        id: 'cmd-source',
        group: 'commands',
        title: JUMP.commands.viewSource.text,
        sub: host(REPO),
        keywords: ['github', 'repo', 'code', 'how'],
        lamp: 'link',
        run: nav(REPO),
      },
      keys
        ? {
            id: 'cmd-keys',
            group: 'commands',
            title: JUMP.commands.shortcutsOff.text,
            keywords: ['slash', 'keys', 'hotkeys'],
            lamp: 'cmd',
            run: () => setShortcuts(false),
            say: JUMP.commands.shortcutsOff.text,
          }
        : {
            id: 'cmd-keys',
            group: 'commands',
            title: JUMP.commands.shortcutsOn.text,
            keywords: ['slash', 'keys', 'hotkeys'],
            lamp: 'cmd',
            run: () => setShortcuts(true),
            say: JUMP.commands.shortcutsOn.text,
          },
    )
    return list
  }, [base, onHome, here, quiet, keys])

  // ---------- filter and group ----------
  const groups = useMemo(() => {
    const query = q.trim().toLowerCase()
    const byGroup = new Map(GROUP_ORDER.map((g) => [g, []]))
    if (!query) {
      const recentLabel = JUMP.groups.recent?.text
      if (recentLabel) {
        for (const id of recents) {
          const it = items.find((x) => x.id === id)
          if (it) byGroup.get('recent').push({ item: it, at: [] })
        }
      }
      const taken = new Set(byGroup.get('recent').map((r) => r.item.id))
      for (const it of items) if (!taken.has(it.id)) byGroup.get(it.group).push({ item: it, at: [] })
      return GROUP_ORDER.filter((g) => byGroup.get(g).length).map((g) => ({ id: g, rows: byGroup.get(g), best: 0 }))
    }
    for (const it of items) {
      const m = match(query, it)
      if (m) byGroup.get(it.group).push({ item: it, at: m.at, score: m.score })
    }
    return GROUP_ORDER.filter((g) => byGroup.get(g).length)
      .map((g) => {
        const rows = byGroup.get(g).sort((a, b) => b.score - a.score)
        return { id: g, rows, best: rows[0].score }
      })
      .sort((a, b) => b.best - a.best)
  }, [q, items, recents])

  const flat = useMemo(() => groups.flatMap((g) => g.rows.map((r) => r.item)), [groups])
  const count = flat.length
  const activeIndex = count ? Math.min(active, count - 1) : -1
  const optId = (it) => `${uid}-o-${it.id}`

  // ---------- open and close ----------
  const close = useCallback(() => {
    const d = dialogRef.current
    if (d?.open) d.close()
  }, [])

  const show = useCallback(({ instant: fast = false, opener = null } = {}) => {
    const d = dialogRef.current
    if (!d) return
    openerRef.current = opener && opener !== document.body ? opener : null
    // Set on the element before it opens, so the entrance reads it on the first frame.
    d.toggleAttribute('data-instant', fast)
    setQ('')
    setActive(0)
    setRecents(readRecents())
    setKeys(shortcutsOn())
    if (!d.open) {
      try {
        d.showModal()
      } catch {
        d.setAttribute('open', '')
      }
    }
    document.documentElement.dataset.dialog = 'jump'
    setOpen(true)
    // Focus inside the same task as the click or key, so iOS raises the keyboard.
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(
    () =>
      registerJump({
        open: show,
        close,
        isOpen: () => !!dialogRef.current?.open,
      }),
    [show, close],
  )

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    const onClose = () => {
      setOpen(false)
      delete document.documentElement.dataset.dialog
      const back = openerRef.current
      openerRef.current = null
      if (back && back.isConnected && typeof back.focus === 'function') back.focus({ preventScroll: true })
    }
    d.addEventListener('close', onClose)
    return () => d.removeEventListener('close', onClose)
  }, [])

  // Result count, announced once typing settles.
  useEffect(() => {
    if (!open) return
    const text = count ? `${count} ${count === 1 && JUMP.result ? JUMP.result.text : JUMP.results.text}` : JUMP.empty.text
    announce(text, { channel: 'jump', debounce: 300 })
  }, [count, open, q])

  // Keep the active option in view.
  useEffect(() => {
    if (!open || activeIndex < 0) return
    const el = document.getElementById(optId(flat[activeIndex]))
    el?.scrollIntoView({ block: 'nearest' })
    // optId is stable for a given uid
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, open, flat])

  const run = (it) => {
    if (!it) return
    pushRecent(it.id)
    // Leaving the page or moving focus elsewhere: nothing to restore.
    openerRef.current = null
    close()
    it.run()
    if (it.say) window.setTimeout(() => announce(it.say), 60)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!count) return
      const dir = e.key === 'ArrowDown' ? 1 : -1
      setActive((a) => (Math.min(a, count - 1) + dir + count) % count)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(flat[activeIndex])
    } else if (e.key === 'PageDown' || e.key === 'PageUp') {
      e.preventDefault()
      if (!count) return
      const step = e.key === 'PageDown' ? 5 : -5
      setActive((a) => Math.max(0, Math.min(count - 1, a + step)))
    }
  }

  // Backdrop click, for browsers without closedby="any".
  const onDialogClick = (e) => {
    if (e.target === dialogRef.current) close()
  }

  let n = -1
  const label = JUMP.label.text

  return (
    <dialog ref={dialogRef} className="jumplist" aria-label={label} closedby="any" onClick={onDialogClick}>
      <div className="jl-panel">
        <div className="jl-field">
          <svg className="jl-search-mark" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="7" cy="7" r="4.6" />
            <path d="M10.4 10.4 14 14" />
          </svg>
          <input
            ref={inputRef}
            className="jl-input"
            type="text"
            role="combobox"
            aria-label={label}
            aria-expanded="true"
            aria-controls={`${uid}-list`}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? optId(flat[activeIndex]) : undefined}
            placeholder={JUMP.placeholder.text}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="go"
          />
          <button type="button" className="jl-close btn-text" onClick={close}>
            {CHROME.close.text}
          </button>
        </div>

        <div ref={listRef} id={`${uid}-list`} className="jl-list" role="listbox" aria-label={label}>
          {count === 0 ? (
            <div className="jl-empty" role="presentation">
              <span className="jl-empty-mark" aria-hidden="true" />
              {JUMP.empty.text}
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.id} role="group" aria-labelledby={`${uid}-g-${g.id}`} className="jl-group">
                <div id={`${uid}-g-${g.id}`} className="jl-group-label label" role="presentation">
                  {JUMP.groups[g.id]?.text ?? g.id}
                </div>
                {g.rows.map(({ item, at }) => {
                  n += 1
                  const i = n
                  const isActive = i === activeIndex
                  return (
                    <div
                      key={item.id}
                      id={optId(item)}
                      role="option"
                      aria-selected={isActive}
                      className="jl-option"
                      data-active={isActive ? '' : undefined}
                      onPointerMove={() => i !== activeIndex && setActive(i)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => run(item)}
                    >
                      <Lamp kind={item.lamp} />
                      <span className="jl-text">
                        <span className="jl-title">
                          <Highlight text={item.title} at={at} />
                        </span>
                        {item.sub && <span className="jl-sub">{item.sub}</span>}
                      </span>
                      {item.hint && <span className="jl-hint mono">{item.hint}</span>}
                      <svg className="jl-enter" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M13 3v5.5a2 2 0 0 1-2 2H3.5M6.5 7.5l-3 3 3 3" />
                      </svg>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
        {Array.isArray(JUMP.hints) && (
          <p className="jl-foot mono" aria-hidden="true">
            {JUMP.hints.map((h) => (
              <span key={h.id}>
                {(h.keys || []).map((k) => (
                  <kbd key={k}>{k}</kbd>
                ))}{' '}
                {h.text}
              </span>
            ))}
          </p>
        )}
      </div>
      <Announcer channel="jump" />
    </dialog>
  )
}
