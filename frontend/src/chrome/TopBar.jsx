import './chrome.css'
import { HERO } from '../content/identity.js'
import ClockChip from './ClockChip.jsx'
import QuietToggle from './QuietToggle.jsx'
import SearchChip from './SearchChip.jsx'
import JumpHost from './JumpHost.jsx'
import NodeMark from './NodeMark.jsx'
import PrintMasthead from './PrintMasthead.jsx'

/*
  TopBar (PLAN.md 3.1). Owned by B. The one <header>.

  Left, the name, led by the same lit node as the favicon. Its node sits
  exactly on the RouteRail's line, so on desktop the line reads as running
  down from the name. Right, the live Plano clock (with the page's
  obstruction light), quiet, and search. Phones keep the name and the clock;
  quiet and search move to the bottom bar.

  Over the hero the bar is clear; it fills in over the first 96px of
  scroll (a scroll-driven opacity on a backing layer, where supported).
  Focus order (QA step 10): name, clock, quiet, search.
*/
export default function TopBar() {
  return (
    <header className="topbar" data-chrome="topbar">
      <div className="topbar-row">
        <a href="#origin" className="tb-name">
          <NodeMark className="tb-node" />
          <span>{HERO.name.text}</span>
        </a>
        <div className="tb-tools">
          <ClockChip />
          <QuietToggle className="tb-wide" />
          <SearchChip className="tb-wide" />
        </div>
      </div>
      <PrintMasthead />
      <JumpHost />
    </header>
  )
}
