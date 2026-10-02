#!/usr/bin/env node
/*
  Repo-root entry for the site QA run. The suite lives in
  frontend/scripts/qa/ (run.mjs and friends); this forwards every flag.

    node scripts/qa.mjs            full run
    node scripts/qa.mjs --fast     no Lighthouse, no external links
    npm run qa -- --no-build       reuse frontend/dist

  First time on a machine: npm run tools --prefix frontend
*/
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const FRONTEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../frontend')
if (!existsSync(path.join(FRONTEND, 'tools/node_modules'))) {
  console.log('qa: installing local tools (lighthouse, axe-core, sharp, mapshaper) into frontend/tools')
  const i = spawnSync('npm', ['install', '--prefix', 'tools', '--no-audit', '--no-fund'], { cwd: FRONTEND, stdio: 'inherit' })
  if (i.status !== 0) process.exit(i.status ?? 1)
}
const r = spawnSync(process.execPath, ['scripts/qa/run.mjs', ...process.argv.slice(2)], { cwd: FRONTEND, stdio: 'inherit' })
process.exit(r.status ?? 1)
