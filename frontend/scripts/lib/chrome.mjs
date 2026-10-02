/*
  Headless Chrome for the QA run and the OG capture. Never opens a window,
  never plays sound.

    const chrome = await launchChrome()      { port, wsUrl, profileDir, kill }
    await chrome.kill()                      Browser.close, then pkill -f <profileDir>, then rm -rf

  Each launch gets a unique --user-data-dir under the scratch dir
  (tools/local.json "scratchDir", or SCRATCH_DIR, or the OS temp dir).
  On this Mac headless Chrome may not exit on its own, so kill() always
  follows up with pkill on the profile path and deletes it. Exit and signal
  handlers do the same if the script dies.
*/
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const FRONTEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export function localConfig() {
  const p = path.join(FRONTEND, 'tools/local.json')
  try {
    return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {}
  } catch {
    return {}
  }
}

export function scratchDir() {
  return process.env.SCRATCH_DIR || localConfig().scratchDir || path.join(os.tmpdir(), 'ae-site-scratch')
}

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean)

const live = new Set()
let hooked = false

function hookExit() {
  if (hooked) return
  hooked = true
  const cleanAll = () => {
    for (const dir of live) {
      spawnSync('pkill', ['-f', dir])
      rmSync(dir, { recursive: true, force: true })
    }
    live.clear()
  }
  process.on('exit', cleanAll)
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(sig, () => {
      cleanAll()
      process.exit(130)
    })
  }
}

export async function launchChrome({ tag = 'qa' } = {}) {
  const bin = CHROME_PATHS.find((p) => existsSync(p))
  if (!bin) throw new Error('chrome: no Chrome binary found (set CHROME_PATH)')
  const base = scratchDir()
  mkdirSync(base, { recursive: true })
  const profileDir = path.join(base, `${tag}-${process.pid}-${Date.now()}`)
  mkdirSync(profileDir, { recursive: true })
  live.add(profileDir)
  hookExit()

  const proc = spawn(
    bin,
    [
      '--headless=new',
      `--user-data-dir=${profileDir}`,
      '--remote-debugging-port=0',
      '--remote-allow-origins=*',
      '--mute-audio',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-sync',
      '--disable-default-apps',
      '--disable-features=Translate,MediaRouter,OptimizationHints',
      '--metrics-recording-only',
      '--password-store=basic',
      '--use-mock-keychain',
      '--hide-scrollbars',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
      'about:blank',
    ],
    { stdio: 'ignore', detached: false },
  )

  const portFile = path.join(profileDir, 'DevToolsActivePort')
  const t0 = Date.now()
  while (!existsSync(portFile) || !readFileSync(portFile, 'utf8').includes('\n')) {
    if (Date.now() - t0 > 20000) {
      await kill()
      throw new Error('chrome: DevToolsActivePort never appeared')
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  const port = Number(readFileSync(portFile, 'utf8').split('\n')[0])
  const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()

  async function kill() {
    try {
      const ws = new WebSocket(version?.webSocketDebuggerUrl ?? '')
      await new Promise((r) => {
        ws.onopen = () => {
          ws.send(JSON.stringify({ id: 1, method: 'Browser.close' }))
          setTimeout(r, 300)
        }
        ws.onerror = () => r()
        setTimeout(r, 1500)
      })
    } catch {
      /* already gone */
    }
    try {
      proc.kill('SIGKILL')
    } catch {
      /* already gone */
    }
    spawnSync('pkill', ['-f', profileDir])
    await new Promise((r) => setTimeout(r, 200))
    rmSync(profileDir, { recursive: true, force: true })
    live.delete(profileDir)
  }

  return { port, wsUrl: version.webSocketDebuggerUrl, version, profileDir, kill }
}
