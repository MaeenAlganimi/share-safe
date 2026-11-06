const { app, BrowserWindow, protocol, session } = require('electron')
const fs = require('node:fs/promises')
const path = require('node:path')

protocol.registerSchemesAsPrivileged([{ scheme: 'sharesafe', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }])

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: '#111a20',
    webPreferences: {
      preload: undefined,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  })
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('sharesafe://app/')) event.preventDefault()
  })
  window.loadURL('sharesafe://app/app')
}

app.whenReady().then(() => {
  const distDir = path.join(app.getAppPath(), 'dist')
  protocol.handle('sharesafe', async request => {
    const url = new URL(request.url)
    if (url.host !== 'app') return new Response('Not found', { status: 404 })
    const route = decodeURIComponent(url.pathname).replace(/^\/+/, '')
    const relative = !route || route === 'app' || route.startsWith('app/') ? 'index.html' : route
    const file = path.resolve(distDir, relative)
    if (!file.startsWith(`${distDir}${path.sep}`)) return new Response('Forbidden', { status: 403 })
    try {
      const data = await fs.readFile(file)
      const ext = path.extname(file)
      const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png' }
      return new Response(data, { headers: { 'content-type': types[ext] || 'application/octet-stream', 'content-security-policy': "default-src 'self' data: blob:; script-src 'self' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; worker-src 'self' blob:; connect-src 'self' data: blob:; object-src 'none'; base-uri 'self'; form-action 'self'" } })
    } catch { return new Response('Not found', { status: 404 }) }
  })
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const localApp = webContents.getURL().startsWith('sharesafe://app/')
    callback(localApp && ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write'].includes(permission))
  })
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
