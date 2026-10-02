/*
  A small Chrome DevTools Protocol client (flattened sessions) on Node's
  built-in WebSocket. Enough for the QA run and the OG capture.

    const cdp = await connect(wsUrl)
    const page = await cdp.newPage({ width: 390, height: 844, dpr: 2, mobile: true })
    await page.goto(url)                 waits for load
    await page.eval('document.title')    returns by value, awaits promises
    await page.screenshot(file, { fullPage: true })
    page.console                         [{ type, text }] since the last goto
    page.requests                        [{ url, status, type, bytes, failed }]
    await page.close()
    cdp.close()
*/
import { writeFileSync } from 'node:fs'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl)
  await new Promise((ok, bad) => {
    ws.onopen = ok
    ws.onerror = bad
  })
  let seq = 0
  const pending = new Map()
  const listeners = new Set()
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id && pending.has(m.id)) {
      const { ok, bad, method } = pending.get(m.id)
      pending.delete(m.id)
      if (m.error) bad(new Error(`${method}: ${m.error.message}`))
      else ok(m.result)
    } else for (const f of listeners) f(m)
  }
  const send = (method, params = {}, sessionId) =>
    new Promise((ok, bad) => {
      const id = ++seq
      pending.set(id, { ok, bad, method })
      ws.send(JSON.stringify({ id, method, params, sessionId }))
    })

  async function newPage({ width = 1440, height = 900, dpr = 1, mobile = false, touch = mobile, userAgent } = {}) {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
    const s = (method, params) => send(method, params, sessionId)
    await s('Page.enable')
    await s('Runtime.enable')
    await s('Log.enable')
    await s('Network.enable')
    await s('Network.setCacheDisabled', { cacheDisabled: true })

    const page = { sessionId, targetId, console: [], requests: [], send: s }
    const reqs = new Map()
    listeners.add((m) => {
      if (m.sessionId !== sessionId) return
      const p = m.params
      if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning', 'assert'].includes(p.type))
        page.console.push({ type: p.type, text: p.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 500) })
      if (m.method === 'Runtime.exceptionThrown')
        page.console.push({ type: 'exception', text: (p.exceptionDetails.exception?.description || p.exceptionDetails.text || '').slice(0, 500) })
      if (m.method === 'Log.entryAdded' && ['error', 'warning'].includes(p.entry.level))
        page.console.push({ type: `log-${p.entry.level}`, text: `${p.entry.text} ${p.entry.url || ''}`.slice(0, 500) })
      if (m.method === 'Network.requestWillBeSent') reqs.set(p.requestId, { url: p.request.url, method: p.request.method, type: p.type })
      if (m.method === 'Network.responseReceived') Object.assign(reqs.get(p.requestId) || {}, { status: p.response.status, mime: p.response.mimeType, type: p.type })
      if (m.method === 'Network.loadingFinished') {
        const r = reqs.get(p.requestId)
        if (r) page.requests.push({ ...r, bytes: p.encodedDataLength })
      }
      if (m.method === 'Network.loadingFailed') {
        const r = reqs.get(p.requestId) || {}
        page.requests.push({ ...r, failed: p.errorText, canceled: p.canceled, blocked: p.blockedReason })
      }
    })

    page.setViewport = async ({ width: w, height: h, dpr: d = 1, mobile: mob = false, touch: t = mob }) => {
      await s('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: d, mobile: mob })
      await s('Emulation.setTouchEmulationEnabled', { enabled: t, maxTouchPoints: t ? 5 : 1 })
      page.viewport = { width: w, height: h, dpr: d, mobile: mob }
    }
    await page.setViewport({ width, height, dpr, mobile, touch })
    if (userAgent) await s('Emulation.setUserAgentOverride', { userAgent })

    page.media = (features = []) => s('Emulation.setEmulatedMedia', { features })
    page.reset = () => {
      page.console = []
      page.requests = []
      reqs.clear()
    }
    page.goto = async (url, { wait = 'load', timeout = 20000, settle = 300 } = {}) => {
      page.reset()
      const done = new Promise((r) => {
        const f = (m) => {
          if (m.sessionId === sessionId && m.method === (wait === 'dom' ? 'Page.domContentEventFired' : 'Page.loadEventFired')) {
            listeners.delete(f)
            r()
          }
        }
        listeners.add(f)
      })
      await s('Page.navigate', { url })
      await Promise.race([done, sleep(timeout)])
      if (settle) await sleep(settle)
    }
    page.eval = async (expression) => {
      const r = await s('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true })
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
      return r.result.value
    }
    page.addInitScript = (source) => s('Page.addScriptToEvaluateOnNewDocument', { source })
    page.key = async (key, { modifiers = 0, code, text } = {}) => {
      const keyCode = { Tab: 9, Enter: 13, Escape: 27, ArrowDown: 40, ArrowUp: 38, ' ': 32 }[key] ?? key.toUpperCase().charCodeAt(0)
      const base = { key, code: code ?? (key.length === 1 ? `Key${key.toUpperCase()}` : key), windowsVirtualKeyCode: keyCode, modifiers }
      await s('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', ...base, text })
      await s('Input.dispatchKeyEvent', { type: 'keyUp', ...base })
    }
    page.click = async (x, y) => {
      for (const type of ['mousePressed', 'mouseReleased']) await s('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 })
    }
    page.tap = async (x, y) => {
      await s('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
      await s('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    }
    page.screenshot = async (file, { fullPage = false } = {}) => {
      const params = { format: 'png' }
      if (fullPage) {
        const { cssContentSize } = await s('Page.getLayoutMetrics')
        const h = Math.min(Math.ceil(cssContentSize.height), 16000)
        params.captureBeyondViewport = true
        params.clip = { x: 0, y: 0, width: page.viewport.width, height: h, scale: 1 }
      }
      const { data } = await s('Page.captureScreenshot', params)
      writeFileSync(file, Buffer.from(data, 'base64'))
      return file
    }
    page.close = () => send('Target.closeTarget', { targetId }).catch(() => {})
    return page
  }

  return { send, newPage, close: () => ws.close() }
}
