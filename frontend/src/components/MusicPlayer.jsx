import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Drop more MP3s in /public/audio/ and add them here to extend.
const TRACKS = [
  {
    src: '/audio/the-perfect-pair-slowed.mp3',
    title: 'the perfect pair (slowed)',
    artist: 'ola.wav × beabadoobee',
  },
  {
    src: '/audio/timeless-lv.mp3',
    title: 'timeless (lv version)',
    artist: 'the weeknd · playboi carti · giorgio armani',
  },
]

const LS_KEY = 'ayro.musicplayer.v3'
const DEFAULT_VOLUME = 0.15
const BAR_COUNT = 5

export default function MusicPlayer() {
  const audioRef    = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const gainRef     = useRef(null)
  const dataRef     = useRef(null)
  const rafRef      = useRef(null)
  const barsRef     = useRef([])
  const pulseRef    = useRef(null)

  const [open, setOpen]         = useState(false)
  const [playing, setPlaying]   = useState(false)
  const [muted, setMuted]       = useState(true)
  const [volume, setVolume]     = useState(DEFAULT_VOLUME)
  const [trackIdx, setTrackIdx] = useState(0)

  const t = TRACKS[trackIdx]

  // Restore volume + trackIdx (always start muted)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (!raw) return
      const s = JSON.parse(raw)
      if (typeof s.volume === 'number') setVolume(s.volume)
      if (typeof s.trackIdx === 'number' && s.trackIdx < TRACKS.length) setTrackIdx(s.trackIdx)
    } catch { /* noop */ }
  }, [])

  // Persist
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ volume, trackIdx })) } catch { /* noop */ }
  }, [volume, trackIdx])

  // Apply mute/volume — via gain node once Web Audio is wired, otherwise element-level
  useEffect(() => {
    const a = audioRef.current
    const gain = gainRef.current
    const ctx = audioCtxRef.current
    if (!a) return
    if (gain && ctx) {
      gain.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.02)
    } else {
      a.volume = volume
      a.muted = muted
    }
  }, [volume, muted])

  // Auto-start muted on mount
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    a.muted = true
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }, [])

  // Reload + replay on track change
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const wasPlaying = !a.paused
    a.load()
    if (wasPlaying) a.play().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIdx])

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      const ctx = audioCtxRef.current
      if (ctx && ctx.state !== 'closed') ctx.close().catch(() => {})
    }
  }, [])

  const ensureWebAudio = async () => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx || !audioRef.current) return
      try {
        const ctx = new Ctx()
        const source = ctx.createMediaElementSource(audioRef.current)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.72
        const gain = ctx.createGain()
        gain.gain.value = muted ? 0 : volume
        source.connect(analyser)
        analyser.connect(gain)
        gain.connect(ctx.destination)
        audioCtxRef.current = ctx
        analyserRef.current = analyser
        gainRef.current = gain
        dataRef.current = new Uint8Array(analyser.frequencyBinCount)
        audioRef.current.muted = false
        audioRef.current.volume = 1
        startRaf()
      } catch { /* setup failed */ }
    }
    const ctx = audioCtxRef.current
    if (ctx && ctx.state === 'suspended') {
      try { await ctx.resume() } catch { /* noop */ }
    }
  }

  const startRaf = () => {
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick)
      const analyser = analyserRef.current
      const data = dataRef.current
      const bars = barsRef.current
      const pulse = pulseRef.current
      if (!analyser || !data) return
      analyser.getByteFrequencyData(data)

      const halfN = data.length >> 1
      for (let i = 0; i < BAR_COUNT; i++) {
        const start = Math.floor((i / BAR_COUNT) * halfN)
        const end   = Math.floor(((i + 1) / BAR_COUNT) * halfN)
        let sum = 0
        for (let j = start; j < end; j++) sum += data[j]
        const avg = (sum / Math.max(end - start, 1)) / 255
        const scaled = 0.18 + avg * 0.82
        const bar = bars[i]
        if (bar) bar.style.transform = `scaleY(${scaled})`
      }

      const bass = (data[1] + data[2] + data[3] + data[4] + data[5]) / 5 / 255
      if (pulse) pulse.style.opacity = String(Math.min(bass * 1.0, 0.25))
    }
    tick()
  }

  const togglePlay = async () => {
    await ensureWebAudio()
    const a = audioRef.current
    if (!a) return
    if (playing) {
      a.pause()
      setPlaying(false)
    } else {
      try { await a.play(); setPlaying(true) } catch { /* blocked */ }
    }
  }

  const toggleMute = async () => {
    await ensureWebAudio()
    const a = audioRef.current
    if (!a) return
    const willBeMuted = !muted
    if (!willBeMuted && !playing) {
      try { await a.play(); setPlaying(true) } catch { /* noop */ }
    }
    setMuted(willBeMuted)
  }

  const nextTrack = async () => {
    await ensureWebAudio()
    setTrackIdx((i) => (i + 1) % TRACKS.length)
  }

  const onVolumeChange = (e) => {
    // Update state synchronously so the controlled slider tracks the drag without snap-back.
    setVolume(parseFloat(e.target.value))
    // Lazy-init Web Audio on first interaction (fire-and-forget — no await).
    if (!audioCtxRef.current) ensureWebAudio()
  }

  const liveColor   = '#6ee7a3'
  const idleColor   = '#ffb86b'
  const activeColor = muted ? idleColor : liveColor
  const trackLabel  = `${String(trackIdx + 1).padStart(2, '0')} / ${String(TRACKS.length).padStart(2, '0')}`

  return (
    <>
      <audio
        ref={audioRef}
        src={t.src}
        loop
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setPlaying(false)}
      />

      <div
        ref={pulseRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 42% at 50% 0%, rgba(109,213,255,0.5), transparent 70%)',
          opacity: 0,
          zIndex: 5,
          mixBlendMode: 'screen',
        }}
      />

      <div className="fixed top-[72px] right-5 z-40 select-none">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.16 }}
              className="absolute right-0"
              style={{ top: 44, width: 290 }}
            >
            <div
              className="panel font-mono"
              style={{ background: 'rgba(12,14,20,0.96)', backdropFilter: 'blur(8px)' }}
            >
              {/* Header */}
              <div className="flex items-center gap-2.5 px-4 h-9 border-b border-border">
                <span
                  className="text-cyan"
                  style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em' }}
                >
                  NOW.PLAYING
                </span>
                <span className="flex-1 h-px bg-line" />
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: activeColor,
                    boxShadow: `0 0 7px ${activeColor}`,
                    animation: muted ? 'none' : 'blink 1.4s ease-in-out infinite',
                  }}
                />
                <span
                  className="eyebrow"
                  style={{ letterSpacing: '0.14em', color: activeColor }}
                >
                  {muted ? 'MUTED' : 'LIVE'}
                </span>
              </div>

              {/* Body */}
              <div className="p-4">
                <p className="text-ink truncate" style={{ fontSize: '13.5px', fontWeight: 600, letterSpacing: '0.005em' }}>
                  {t.title}
                </p>
                <p className="text-dim truncate" style={{ fontSize: '11.5px', marginTop: 3 }}>
                  {t.artist}
                </p>

                {/* Controls row */}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={togglePlay}
                    aria-label={playing ? 'Pause' : 'Play'}
                    className="flex items-center justify-center text-cyan border border-cyan/40 hover:bg-cyan/10 transition-colors shrink-0"
                    style={{ width: 32, height: 32, borderRadius: 3 }}
                  >
                    {playing ? <PauseIcon /> : <PlayIcon />}
                  </button>
                  <button
                    onClick={toggleMute}
                    className="font-mono h-8 border transition-colors flex-1"
                    style={{
                      fontSize: '10.5px',
                      letterSpacing: '0.16em',
                      color: activeColor,
                      borderColor: muted ? 'rgba(255,184,107,0.4)' : 'rgba(110,231,163,0.4)',
                      background: muted ? 'rgba(255,184,107,0.05)' : 'rgba(110,231,163,0.05)',
                      borderRadius: 3,
                    }}
                  >
                    {muted ? 'UNMUTE' : 'MUTE'}
                  </button>
                  <button
                    onClick={nextTrack}
                    aria-label="Next track"
                    title="Next track"
                    className="font-mono h-8 px-3 border border-border text-dim hover:text-cyan hover:border-cyan/40 transition-colors shrink-0"
                    style={{ fontSize: '10.5px', letterSpacing: '0.14em', borderRadius: 3 }}
                  >
                    {trackLabel} <span style={{ marginLeft: 2 }}>→</span>
                  </button>
                </div>

                {/* Volume slider */}
                <div className="flex items-center gap-3 mt-4">
                  <input
                    type="range"
                    min="0" max="1" step="0.01"
                    value={volume}
                    onChange={onVolumeChange}
                    aria-label="Volume"
                    className="mp-slider flex-1 cursor-pointer"
                  />
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '10.5px',
                      letterSpacing: '0.1em',
                      color: muted ? idleColor : '#aeb9c9',
                      minWidth: '4ch',
                      textAlign: 'right',
                    }}
                  >
                    {muted ? '— —' : `${Math.round(volume * 100)}%`}
                  </span>
                </div>
              </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trigger pill */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close audio panel' : 'Open audio panel'}
          className="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-[rgba(109,213,255,0.04)]"
          style={{
            background: 'rgba(12,14,20,0.92)',
            border: '1px solid rgba(109,213,255,0.32)',
            borderRadius: 3,
            backdropFilter: 'blur(8px)',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              color: '#6dd5ff',
              fontSize: '13px',
              lineHeight: 1,
              transform: 'translateY(-1px)',
              display: 'inline-block',
              filter: `drop-shadow(0 0 6px ${muted ? 'transparent' : 'rgba(109,213,255,0.55)'})`,
              transition: 'filter 0.2s',
            }}
          >
            ♫
          </span>
          <div className="flex items-end gap-[2px]" style={{ height: 12, width: 18 }}>
            {Array.from({ length: BAR_COUNT }).map((_, i) => (
              <div
                key={i}
                ref={(el) => (barsRef.current[i] = el)}
                style={{
                  width: 2,
                  height: '100%',
                  background: muted ? 'rgba(109,213,255,0.45)' : '#6dd5ff',
                  transformOrigin: 'bottom',
                  transform: 'scaleY(0.2)',
                  borderRadius: 1,
                  transition: 'background 0.25s',
                }}
              />
            ))}
          </div>
          <span
            className="font-mono"
            style={{ fontSize: '10.5px', letterSpacing: '0.16em', color: activeColor }}
          >
            {muted ? 'MUTED' : 'LIVE'}
          </span>
        </button>
      </div>
    </>
  )
}

function PlayIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
      <path d="M3 1.5 L10 6 L3 10.5 Z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="10" height="11" viewBox="0 0 10 12" fill="currentColor">
      <rect x="1" y="1" width="2.5" height="10" />
      <rect x="6.5" y="1" width="2.5" height="10" />
    </svg>
  )
}
