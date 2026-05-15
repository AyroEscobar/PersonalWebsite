import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Tracks live in /public/audio/. Drop MP3s with these filenames or edit this list.
// First track that successfully loads is the default.
const TRACKS = [
  { src: '/audio/lofi.mp3',     title: 'Lo-fi Loop',     artist: 'Ambient'    },
  { src: '/audio/jazz.mp3',     title: 'Late Jazz',      artist: 'Standards'  },
  { src: '/audio/piano.mp3',    title: 'Soft Piano',     artist: 'Solo'       },
  { src: '/audio/ambient.mp3',  title: 'Warm Pad',       artist: 'Ambient'    },
]

const LS_KEY = 'ayro.musicplayer.v1'

export default function MusicPlayer() {
  const audioRef = useRef(null)
  const [open, setOpen]         = useState(false)
  const [playing, setPlaying]   = useState(false)
  const [volume, setVolume]     = useState(0.4)
  const [trackIdx, setTrackIdx] = useState(0)
  const [available, setAvail]   = useState(null) // null = unknown, true/false after probe

  // Restore persisted prefs
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (!raw) return
      const s = JSON.parse(raw)
      if (typeof s.volume === 'number')   setVolume(s.volume)
      if (typeof s.trackIdx === 'number') setTrackIdx(Math.min(s.trackIdx, TRACKS.length - 1))
    } catch {}
  }, [])

  // Persist on change
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ volume, trackIdx })) } catch {}
  }, [volume, trackIdx])

  // Apply volume to audio
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  // Probe whether the current track exists; mark unavailable if it doesn't
  useEffect(() => {
    let cancelled = false
    setAvail(null)
    fetch(TRACKS[trackIdx].src, { method: 'HEAD' })
      .then(r => { if (!cancelled) setAvail(r.ok) })
      .catch(() => { if (!cancelled) setAvail(false) })
    return () => { cancelled = true }
  }, [trackIdx])

  const toggle = async () => {
    const a = audioRef.current
    if (!a) return
    if (playing) {
      a.pause()
      setPlaying(false)
      return
    }
    try {
      await a.play()
      setPlaying(true)
    } catch {
      setPlaying(false)
    }
  }

  const next = () => {
    setPlaying(false)
    setTrackIdx(i => (i + 1) % TRACKS.length)
  }

  const t = TRACKS[trackIdx]

  return (
    <>
      <audio
        ref={audioRef}
        src={t.src}
        loop
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => { setPlaying(false); setAvail(false) }}
      />

      <div className="fixed bottom-5 right-5 z-50 select-none">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="mb-3 rounded-sm overflow-hidden"
              style={{
                width: '260px',
                background: 'linear-gradient(145deg, rgba(235,223,197,0.98), rgba(220,207,176,0.94))',
                border: '1px solid rgba(74,53,38,0.18)',
                boxShadow: '0 18px 40px rgba(74,53,38,0.18), 0 0 0 1px rgba(74,53,38,0.04)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div className="px-4 py-3">
                <p
                  className="smallcaps mb-2"
                  style={{ fontSize: '11px', letterSpacing: '0.22em', color: '#9c8a72' }}
                >
                  Now Playing
                </p>
                <p
                  className="text-[#2a1f15] truncate"
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontWeight: 600,
                    fontSize: '17px',
                    lineHeight: 1.1,
                  }}
                >
                  {t.title}
                </p>
                <p
                  className="text-[#6b5645] truncate"
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontStyle: 'italic',
                    fontSize: '13px',
                    marginTop: '2px',
                  }}
                >
                  {available === false ? 'drop an MP3 in /public/audio/' : t.artist}
                </p>

                <div className="flex items-center justify-between mt-4 mb-2">
                  <button
                    onClick={toggle}
                    disabled={available === false}
                    aria-label={playing ? 'Pause' : 'Play'}
                    className="flex items-center justify-center transition-all"
                    style={{
                      width: 36, height: 36,
                      borderRadius: '50%',
                      background: available === false ? 'rgba(74,53,38,0.12)' : '#9e451d',
                      color: available === false ? '#9c8a72' : '#f3ead6',
                      cursor: available === false ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {playing ? <PauseIcon /> : <PlayIcon />}
                  </button>
                  <button
                    onClick={next}
                    aria-label="Next track"
                    className="text-[#6b5645] hover:text-[#2a1f15] transition-colors px-2"
                    style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: '13px' }}
                  >
                    skip →
                  </button>
                </div>

                <label className="flex items-center gap-2 mt-1">
                  <span
                    className="text-[#9c8a72]"
                    style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: '11px' }}
                  >
                    vol
                  </span>
                  <input
                    type="range"
                    min="0" max="1" step="0.01"
                    value={volume}
                    onChange={e => setVolume(parseFloat(e.target.value))}
                    aria-label="Volume"
                    className="flex-1 accent-[#9e451d]"
                    style={{ accentColor: '#9e451d' }}
                  />
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trigger pill */}
        <button
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close music player' : 'Open music player'}
          className="flex items-center gap-2 px-3 py-2 rounded-full transition-all hover:-translate-y-0.5"
          style={{
            background: 'rgba(235,223,197,0.92)',
            border: '1px solid rgba(74,53,38,0.20)',
            boxShadow: '0 8px 22px rgba(74,53,38,0.12)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <span
            className="inline-block"
            style={{
              width: 9, height: 9, borderRadius: '50%',
              background: playing ? '#9e451d' : '#9c8a72',
              boxShadow: playing ? '0 0 8px rgba(196,101,53,0.55)' : 'none',
              transition: 'all 0.3s',
            }}
          />
          <span
            className="text-[#4f3d2e]"
            style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: '13.5px' }}
          >
            {playing ? 'on the air' : 'tune in'}
          </span>
        </button>
      </div>
    </>
  )
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M3 1.5 L12 7 L3 12.5 Z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
      <rect x="1" y="1" width="3" height="12" />
      <rect x="8" y="1" width="3" height="12" />
    </svg>
  )
}
