# Music for the player widget

Drop MP3 files here with these exact names and the player picks them up automatically:

- `lofi.mp3`      — lo-fi loop
- `jazz.mp3`      — late jazz / standards
- `piano.mp3`     — soft solo piano
- `ambient.mp3`   — warm pad

You can change the track list (filenames, titles, artists) in
`frontend/src/components/MusicPlayer.jsx` — see the `TRACKS` array near the top.

## What to use

Pick something that fits the vibe:
- Lo-fi hip-hop loops (LoFi Girl-style)
- Mid-century jazz standards
- Soft instrumental piano
- Ambient pads

## Sourcing tracks

Free / royalty-free options:
- **Pixabay Music** — https://pixabay.com/music/ — CC0
- **Free Music Archive** — https://freemusicarchive.org/
- **Uppbeat** — free tier with attribution
- **YouTube Audio Library** — free, no attribution required for personal use

Make sure whatever you use is OK to host on a public website. When in doubt,
attribute the artist in the footer.

## File requirements

- `.mp3` format
- Reasonable length (2–10 min loops work well)
- Reasonable bitrate (128–192 kbps is plenty for ambient)
- Looping content is nice — the player loops by default

The player gracefully shows "drop an MP3" if the file is missing. No errors,
just a friendly hint.
