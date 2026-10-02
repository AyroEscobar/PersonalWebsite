import { useEffect, useState } from 'react'
import { register } from '../lib/announce.js'

/* A polite, visually hidden status region. See src/lib/announce.js. */
export default function Announcer({ channel = 'page' }) {
  const [text, setText] = useState('')
  useEffect(() => register(channel, setText), [channel])
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {text}
    </div>
  )
}
