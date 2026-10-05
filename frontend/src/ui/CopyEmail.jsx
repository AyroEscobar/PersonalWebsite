import { useState } from 'react'
import Button from './Button.jsx'
import Tooltip from './Tooltip.jsx'
import { Copy } from './icons.jsx'
import { toast } from './toast-bus.js'
import { EMAIL } from '../content/constants.js'
import { SIGNAL } from '../content/signal.js'
import { W } from '../content/sections-ui.js'

/*
  Copy the email address (DESIGN.md 5.13): the primary pill in the contact
  card. While the clipboard write runs the label reads "copying email"; then
  the toast says "copied". If the clipboard is blocked, the address on the
  page is selected and the toast says how to copy it.
*/
export default function CopyEmail({ addressId, state, busy: forcedBusy = false, tipOpen = false }) {
  const [busy, setBusy] = useState(false)

  const copy = async () => {
    setBusy(true)
    let ok = false
    try {
      await navigator.clipboard.writeText(EMAIL)
      ok = true
    } catch {
      ok = false
    }
    setBusy(false)
    if (ok) return toast(SIGNAL.copied.text)
    const el = addressId && document.getElementById(addressId)
    if (el) {
      const r = document.createRange()
      r.selectNodeContents(el)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(r)
    }
    toast(W.copySelectedStatus.text)
  }

  return (
    <Tooltip label={SIGNAL.copyTip.text} open={tipOpen}>
      <Button variant="primary" icon={Copy} busy={busy || forcedBusy} busyLabel={SIGNAL.copyingEmail.text} state={state} onClick={copy}>
        {SIGNAL.copyEmail.text}
      </Button>
    </Tooltip>
  )
}
