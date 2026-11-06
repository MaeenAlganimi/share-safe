import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const output = path.join(root, 'desktop/release')
await mkdir(output, { recursive: true })
for (const entry of await readdir(output)) await rm(path.join(output, entry), { recursive: true, force: true })
function run(args) {
  const result = spawnSync(path.join(root, 'node_modules/.bin/electron-builder'), args, { cwd: root, stdio: 'inherit', env: process.env })
  return result.status === 0
}
if (!run(['--config', 'desktop/builder.json', '--linux', 'AppImage', '--x64'])) process.exit(1)
let windowsTarget = 'nsis'
if (!run(['--config', 'desktop/builder.json', '--win', 'nsis', '--x64'])) {
  console.warn('NSIS build failed (typically Wine is unavailable); falling back to the Windows ZIP target.')
  windowsTarget = 'zip'
  if (!run(['--config', 'desktop/builder-zip.json', '--win', 'zip', '--x64'])) process.exit(1)
}
const files = await readdir(output)
const linuxName = 'ShareSafe-x86_64.AppImage'
const windowsName = windowsTarget === 'nsis' ? 'ShareSafe-Setup-x64.exe' : 'ShareSafe-win-x64.zip'
for (const [actual, expected] of [[files.find(n => n.endsWith('.AppImage')), linuxName], [files.find(n => n.endsWith(windowsTarget === 'nsis' ? '.exe' : '.zip')), windowsName]]) {
  if (!actual) throw new Error(`Missing ${expected} output in ${output}`)
  if (actual !== expected) await (await import('node:fs/promises')).rename(path.join(output, actual), path.join(output, expected))
}
async function artifact(name) {
  const file = path.join(output, name)
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(file)) hash.update(chunk)
  return { name, size: (await stat(file)).size, sha256: hash.digest('hex') }
}
const manifest = { linux: await artifact(linuxName), windows: await artifact(windowsName) }
await writeFile(path.join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
await writeFile(path.join(root, 'src/ui/release-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
for (const entry of await readdir(output)) if (![linuxName, windowsName, 'manifest.json'].includes(entry)) await rm(path.join(output, entry), { recursive: true, force: true })
console.log(`Built unsigned Linux AppImage and Windows ${windowsTarget}; manifest written to desktop/release/manifest.json and src/ui/release-manifest.json.`)
