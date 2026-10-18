/*
  The amphora's stage: a decorative box the one canvas moves into while the reader is in the belly.
  data-band="pot", so the frieze host treats it like the frieze bands: .frieze-art holds the canvas,
  .room is the box (reserved by its size in pot.css, so nothing shifts when the canvas lands).

    <PotStage />   in the belly's rail from 1100 px (App.jsx), or in a band of its own above Contact
*/
export default function PotStage({ className = '' }) {
  return (
    <div className={`pot ${className}`.trim()} data-band="pot" aria-hidden="true">
      <div className="frieze-art pot-art" />
      <div className="room pot-room" />
    </div>
  )
}
