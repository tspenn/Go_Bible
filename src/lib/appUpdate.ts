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

function stripReloadParam() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('_r')) return
  url.searchParams.delete('_r')
  const next = `${url.pathname}${url.search}${url.hash}`
  window.history.replaceState({}, '', next)
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
  const url = new URL(window.location.href)
  url.searchParams.set('_r', Date.now().toString())
  window.location.replace(url.toString())
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

async function versionFileIsNewer() {
  const res = await fetch(`/version.json?t=${Date.now()}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  })
  if (!res.ok) return false
  const data = (await res.json()) as { id?: string }
  return Boolean(data.id && __BUILD_ID__ && data.id !== __BUILD_ID__)
}

async function htmlAssetsAreNewer() {
  const current = currentAssetScripts()
  if (!current) return false
  const res = await fetch(`/?_=${Date.now()}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  })
  if (!res.ok) return false
  const remote = assetScriptsFromHtml(await res.text())
  return Boolean(remote) && remote !== current
}

export async function hasNewDeploy() {
  try {
    if (await versionFileIsNewer()) return true
  } catch {
    /* HTML fallback */
  }
  try {
    return await htmlAssetsAreNewer()
  } catch {
    return false
  }
}

export function useAppUpdate() {
  const [standalone, setStandalone] = useState(isStandaloneApp)
  const [updateReady, setUpdateReady] = useState(false)

  useEffect(() => {
    stripReloadParam()
  }, [])

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
    const id = window.setInterval(check, 60 * 1000)
    function onVis() {
      if (document.visibilityState === 'visible') void check()
    }
    function onResume() {
      void check()
    }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', onResume)
    window.addEventListener('pageshow', onResume)
    return () => {
      alive = false
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', onResume)
      window.removeEventListener('pageshow', onResume)
    }
  }, [])

  return { standalone, updateReady, refresh: reloadApp }
}
