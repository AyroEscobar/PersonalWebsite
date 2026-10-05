import { item, ui } from './item.js'
import { EMAIL, GITHUB, INSTAGRAM, LINKEDIN } from './constants.js'

/*
  Contact (COPY.md 3.6). "Onto what's next." appears exactly once on the whole
  site (check-content enforces it). Three channels; Viaere has its own card.
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
  copyEmail: ui('signal-copy-email', 'copy email'),
  copied: ui('signal-copied', 'copied'),
  copiedStatus: ui('signal-copied-status', 'email copied'),
  elsewhere: ui('signal-elsewhere', 'elsewhere'),
  channels: [
    { id: 'channel-github', label: 'GitHub', href: GITHUB, facts: ['ln-github'] },
    { id: 'channel-linkedin', label: 'LinkedIn', href: LINKEDIN, facts: ['ln-linkedin'] },
    { id: 'channel-instagram', label: 'Instagram', href: INSTAGRAM, facts: ['ln-instagram'] },
  ],
  closer: item('signal-closer', "Onto what's next.", ['voice-post-closers']),
}
