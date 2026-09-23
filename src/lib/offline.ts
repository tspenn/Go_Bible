export type OfflineState = 'need' | 'saving' | 'ready' | 'stale' | 'error' | 'unsupported'

export type OfflineStatus = {
  state: OfflineState
  done: number
  total: number
  mb: number
  detail?: string
}

export type OfflineManifest = {
  id: string
  bytes: number
  files: string[]
}

const SAVED_ID = 'wbf-offline-id'

function cacheName(id: string) {
  return `wbf-${id}`
}

function empty(state: OfflineState, extra?: Partial<OfflineStatus>): OfflineStatus {
  return { state, done: 0, total: 0, mb: 0, ...extra }
}

export function mbLabel(mb: number) {
  if (mb < 1) return `${Math.max(1, Math.round(mb * 1024))} KB`
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`
}

export async function loadOfflineManifest(): Promise<OfflineManifest> {
  const res = await fetch(`/offline-manifest.json?t=${Date.now()}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('offline-manifest')
  return (await res.json()) as OfflineManifest
}

export async function currentOfflineStatus(): Promise<OfflineStatus> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return empty('unsupported', { detail: 'This browser cannot save the Bible for offline use.' })
  }
  const saved = localStorage.getItem(SAVED_ID)
  try {
    const man = await loadOfflineManifest()
    const mb = man.bytes / (1024 * 1024)
    const cache = await caches.open(cacheName(man.id))
    const ready = Boolean(saved === man.id && (await cache.match('/index.html')))
    if (ready) return { state: 'ready', done: man.files.length, total: man.files.length, mb }
    if (saved && saved !== man.id) {
      return { state: 'stale', done: 0, total: man.files.length, mb }
    }
    return { state: 'need', done: 0, total: man.files.length, mb }
  } catch {
    if (saved) return empty('ready', { detail: 'Saved on this device.' })
    return empty('need')
  }
}

async function putAll(cache: Cache, url: string, res: Response) {
  const copy = res.clone()
  await cache.put(url, copy)
  if (url === '/index.html') await cache.put('/', res.clone())
}

export async function downloadOfflinePack(onStatus: (s: OfflineStatus) => void): Promise<OfflineStatus> {
  if (!('caches' in window)) {
    const s = empty('unsupported', { detail: 'This browser cannot save the Bible for offline use.' })
    onStatus(s)
    return s
  }
  const man = await loadOfflineManifest()
  const total = man.files.length
  const mb = man.bytes / (1024 * 1024)
  const cache = await caches.open(cacheName(man.id))
  onStatus({ state: 'saving', done: 0, total, mb })

  let done = 0
  let cursor = 0
  const workers = 6
  async function take() {
    while (cursor < man.files.length) {
      const url = man.files[cursor]!
      cursor += 1
      const res = await fetch(url, { cache: 'reload' })
      if (!res.ok) throw new Error(url)
      await putAll(cache, url, res)
      done += 1
      if (done === total || done % 8 === 0) {
        onStatus({ state: 'saving', done, total, mb })
      }
    }
  }
  await Promise.all(Array.from({ length: workers }, () => take()))
  localStorage.setItem(SAVED_ID, man.id)
  const ready: OfflineStatus = { state: 'ready', done: total, total, mb }
  onStatus(ready)
  return ready
}

export function registerOfflineWorker() {
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' })
  })
}
