import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const buildId = Date.now().toString()

function emitVersion(): Plugin {
  return {
    name: 'emit-version',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ id: buildId }),
      })
    },
  }
}

function walkFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name)
    if (statSync(abs).isDirectory()) walkFiles(abs, out)
    else out.push(abs)
  }
  return out
}

function toUrl(root: string, abs: string) {
  return `/${relative(root, abs).split('\\').join('/')}`
}

function serviceWorkerSource(id: string) {
  return `/* Walking By Faith offline pack. Generated at build. */
const BUILD = ${JSON.stringify(id)}
const CACHE = 'wbf-' + BUILD

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(['/', '/index.html', '/manifest.webmanifest']))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('wbf-') && k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

function isFreshProbe(url) {
  return (
    url.pathname === '/version.json' ||
    url.pathname === '/offline-manifest.json' ||
    url.pathname === '/sw.js'
  )
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (isFreshProbe(url) || url.searchParams.has('_') || url.searchParams.has('_r')) {
    event.respondWith(fetch(req).catch(() => caches.match(url.pathname)))
    return
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const forIndex = res.clone()
            const forRoot = res.clone()
            caches.open(CACHE).then((cache) => {
              void cache.put('/index.html', forIndex)
              void cache.put('/', forRoot)
            })
          }
          return res
        })
        .catch(() => caches.match('/index.html').then((hit) => hit || caches.match('/'))),
    )
    return
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit
      return caches.match(url.pathname).then((pathHit) => {
        if (pathHit) return pathHit
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put(req, copy))
          }
          return res
        })
      })
    }),
  )
})
`
}

function emitOfflinePack(): Plugin {
  return {
    name: 'offline-pack',
    apply: 'build',
    writeBundle(options) {
      const root = options.dir ?? join(process.cwd(), 'dist')
      const skip = new Set(['/sw.js', '/version.json', '/offline-manifest.json'])
      const files = walkFiles(root)
        .map((abs) => toUrl(root, abs))
        .filter((url) => !skip.has(url))
        .sort()
      const bytes = files.reduce((sum, url) => {
        try {
          return sum + statSync(join(root, url.slice(1))).size
        } catch {
          return sum
        }
      }, 0)
      writeFileSync(join(root, 'offline-manifest.json'), JSON.stringify({ id: buildId, bytes, files }))
      writeFileSync(join(root, 'sw.js'), serviceWorkerSource(buildId))
    },
  }
}

export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [react(), emitVersion(), emitOfflinePack()],
  server: {
    watch: {
      ignored: ['**/scripts/raw/**'],
    },
  },
})
