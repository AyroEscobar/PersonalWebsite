/*
  The amphora's stage: a decorative box the one canvas moves into while the reader is in the belly.
  data-band="pot", so the frieze host treats it like the frieze bands: .frieze-art holds the canvas,
  .room is the box (reserved by its size in pot.css, so nothing shifts). Until the canvas arrives it shows
  a still of the pot, rendered from the scene (scripts/poster.mjs --pot), one AVIF per theme: turned away
  (-70 degrees, the painting round the left limb) in a live tier, where the canvas turns it into view and
  its first frame lands on the still; facing (0) in the still tier and under quiet, the finished page.

    <PotStage />   in the belly's rail from 1100 px (App.jsx), or in a band of its own above Contact
*/
const STILL = (theme, kind) => `/pot/pot-${theme}-${kind}.avif`

export default function PotStage({ className = '' }) {
  return (
    <div className={`pot ${className}`.trim()} data-band="pot" aria-hidden="true">
      <div className="frieze-art pot-art" />
      <div className="room pot-room">
        {['light', 'dark'].map((th) =>
          ['in', 'face'].map((k) => <img key={th + k} className={`pot-still pot-still--${th} pot-still--${k}`} src={STILL(th, k)} width="560" height="857" alt="" loading="lazy" decoding="async" />),
        )}
      </div>
    </div>
  )
}
