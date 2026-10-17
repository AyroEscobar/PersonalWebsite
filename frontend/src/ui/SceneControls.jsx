import { CHROME } from '../content/meta.js'
import { useHydrated } from '../lib/hydrated.js'
import { setMotion, useQuiet, useTier } from '../lib/mode.js'
import { setPaused, useStore } from '../lib/store.js'

/*
  <SceneControls>: two words in the foot, in the label face: "pause the scene" / "play the scene"
  (aria-pressed) and "motion off" / "motion on" (aria-pressed, persisted). In the still tier and under
  quiet there is no scene to pause, so the pause control is hidden; motion reads "motion off",
  disabled, with the tip "reduced motion is on" when the OS asked for it. `tier`, `paused`, `motion`
  force looks for the kit (inert).
*/
export default function SceneControls({ tier: forcedTier, paused: forcedPaused, motion: forcedMotion, state, className = '' }) {
  const hydrated = useHydrated()
  const liveTier = useTier()
  const quiet = useQuiet()
  const livePaused = useStore((s) => s.paused)
  const liveMotion = useStore((s) => s.motion)
  const kit = forcedTier !== undefined || forcedPaused !== undefined || forcedMotion !== undefined
  const tier = forcedTier ?? liveTier
  const paused = forcedPaused ?? livePaused
  const motion = forcedMotion ?? liveMotion
  const still = tier === 'still'
  const off = motion === 'off'
  const reducedByOs = still && !off
  const st = state ? ` is-${state}` : ''
  return (
    <div className={`scene-ctl ${className}`.trim()} data-print="skip">
      {!still && !(quiet && !kit) && (
        <button type="button" className={`ctl${st}`} aria-pressed={paused} onClick={kit ? undefined : () => setPaused(!paused)} tabIndex={kit ? -1 : undefined}>
          {paused ? CHROME.play.text : CHROME.pause.text}
        </button>
      )}
      <button
        type="button"
        className={`ctl${st}`}
        aria-pressed={off}
        disabled={reducedByOs && (hydrated || kit) ? true : undefined}
        title={reducedByOs ? CHROME.reducedTip.text : undefined}
        onClick={kit ? undefined : () => setMotion(off)}
        tabIndex={kit ? -1 : undefined}
      >
        {off ? CHROME.motionOn.text : CHROME.motionOff.text}
      </button>
    </div>
  )
}
