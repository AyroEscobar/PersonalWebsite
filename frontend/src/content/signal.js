import { item, ui } from './item.js'
import { EMAIL, GITHUB, INSTAGRAM, LINKEDIN, VIAERE } from './constants.js'

/*
  The signal section (PLAN.md 3.8). Rendered by C (SignalLine is C's).
  "Onto what's next." appears exactly once on the whole site (check-content
  enforces it). Only the four channels below (questions.md #2, #10).
*/

export const SIGNAL = {
  paragraph: item(
    'signal-paragraph',
    'Building something, stuck on something hard, or just want to trade ideas? My inbox is open and I move fast. I am always down to meet people who build.',
    ['voice-contact'],
    { verbatim: 'voice-contact' },
  ),
  email: item('signal-email', EMAIL, ['ln-email'], { mailto: `mailto:${EMAIL}` }),
  copy: ui('signal-copy', 'copy'),
  copied: ui('signal-copied', 'copied'),
  copiedStatus: ui('signal-copied-status', 'email copied'),
  write: ui('signal-write', 'write'),
  packetLabel: item('signal-packet-label', 'plano, tx', ['identity-hometown']),
  channels: [
    { id: 'channel-github', label: 'GitHub', href: GITHUB, facts: ['ln-github'] },
    { id: 'channel-linkedin', label: 'LinkedIn', href: LINKEDIN, facts: ['ln-linkedin'] },
    { id: 'channel-instagram', label: 'Instagram', href: INSTAGRAM, facts: ['ln-instagram'] },
    { id: 'channel-viaere', label: 'Viaere', href: VIAERE, facts: ['ln-viaere'] },
  ],
  closer: item('signal-closer', "Onto what's next.", ['voice-post-closers']),
}
