import { useEffect, useState } from 'react'

export function isStandaloneApp() {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  if (nav.standalone) return true
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches
  )
}

export async function reloadApp() {
  if ('caches' in window) {
    try {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    } catch {
      /* ignore */
    }
  }
  window.location.reload()
}

function assetScriptsFromHtml(html: string) {
  return [...html.matchAll(/\/assets\/[^"'>\s]+\.js/g)]
    .map((m) => m[0])
    .sort()
    .join('|')
}

function currentAssetScripts() {
  return [...document.querySelectorAll('script[src]')]
    .map((el) => {
      try {
        return new URL((el as HTMLScriptElement).src, window.location.origin).pathname
      } catch {
        return ''
      }
    })
    .filter((p) => p.includes('/assets/'))
    .sort()
    .join('|')
}

export async function hasNewDeploy() {
  const current = currentAssetScripts()
  if (!current) return false
  try {
    const res = await fetch(`/?_=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return false
    const remote = assetScriptsFromHtml(await res.text())
    return Boolean(remote) && remote !== current
  } catch {
    return false
  }
}

export function useAppUpdate() {
  const [standalone, setStandalone] = useState(isStandaloneApp)
  const [updateReady, setUpdateReady] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)')
    const sync = () => setStandalone(isStandaloneApp())
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (import.meta.env.DEV) return
    let alive = true
    async function check() {
      if (!alive) return
      if (await hasNewDeploy()) setUpdateReady(true)
    }
    void check()
    const id = window.setInterval(check, 10 * 60 * 1000)
    function onVis() {
      if (document.visibilityState === 'visible') void check()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      alive = false
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return { standalone, updateReady, refresh: reloadApp }
}
