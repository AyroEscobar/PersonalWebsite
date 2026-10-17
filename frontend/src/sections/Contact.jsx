import Section from '../ui/Section.jsx'
import Button from '../ui/Button.jsx'
import CopyEmail from '../ui/CopyEmail.jsx'
import LinkRow from '../ui/LinkRow.jsx'
import Frieze, { Room } from '../hero/Frieze.jsx'
import { SIGNAL } from '../content/signal.js'

/*
  IV · Contact: the title, then the plate (the paragraph, the coffee chat with its short address on
  hover and in print, the email row with the copy button and its status, "elsewhere", the closer once)
  over the second frieze band, which starts 150 px below the plate's top and holds the room at the right
  with the man arriving near the right edge (he never crests). Under 960 px the band stacks under the
  plate. The title sits above at every width: the band is this section's architecture.
*/
export default function Contact() {
  const short = SIGNAL.coffee.href.replace(/^https?:\/\//, '')
  return (
    <Section
      id="contact"
      className="sec--contact"
      grid={false}
      after={
        <div className="band">
          <div className="wrap band-inner">
            <div className="plate contact-plate">
              <p className="contact-p">{SIGNAL.paragraph.text}</p>
              <p className="contact-coffee">
                <Button variant="fill" href={SIGNAL.coffee.href} rel="noopener" className="btn-cal" data-short={short}>
                  {SIGNAL.coffee.label}
                </Button>
              </p>
              <CopyEmail />
              <LinkRow />
              <p className="closer">{SIGNAL.closer.text}</p>
            </div>
          </div>
          <Frieze band="contact" className="band-clay" meander={false}>
            <div className="wrap band-stage">
              <Room className="stage--contact" />
            </div>
          </Frieze>
        </div>
      }
    />
  )
}
