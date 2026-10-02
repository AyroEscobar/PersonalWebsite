// The axe-core browser bundle, injected into pages by the QA run.
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
const require = createRequire(import.meta.url)
export const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
