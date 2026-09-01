import { useSyncExternalStore } from 'react'
import { findBook, testamentOf, type Testament } from './kjv'

const KEY = 'go-bible-last-read'
const listeners = new Set<() => void>()

export type LastRead = {
  bookSlug: string
  chapter: number
  verse?: number
}

function parse(raw: string | null): LastRead | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as LastRead
    if (!v?.bookSlug || !Number.isFinite(v.chapter) || v.chapter < 1) return null
    if (!findBook(v.bookSlug)) return null
    return {
      bookSlug: v.bookSlug,
      chapter: v.chapter,
      verse: v.verse && v.verse > 0 ? v.verse : undefined,
    }
  } catch {
    return null
  }
}

function read(): LastRead | null {
  try {
    return parse(localStorage.getItem(KEY))
  } catch {
    return null
  }
}

let cached: LastRead | null = typeof localStorage !== 'undefined' ? read() : null

function emit() {
  cached = read()
  listeners.forEach((fn) => fn())
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) emit()
  })
}

export function recordLastRead(bookSlug: string, chapter: number, verse?: number) {
  if (!findBook(bookSlug) || chapter < 1) return
  const next: LastRead = { bookSlug, chapter }
  if (verse && verse > 0) next.verse = verse
  const prev = cached
  if (
    prev &&
    prev.bookSlug === next.bookSlug &&
    prev.chapter === next.chapter &&
    (prev.verse ?? 0) === (next.verse ?? 0)
  ) {
    return
  }
  localStorage.setItem(KEY, JSON.stringify(next))
  emit()
}

export function lastReadHref(loc: LastRead) {
  if (loc.verse) return `/bible/${loc.bookSlug}/${loc.chapter}/${loc.verse}`
  return `/bible/${loc.bookSlug}/${loc.chapter}`
}

export function lastReadLabel(loc: LastRead) {
  const name = findBook(loc.bookSlug)?.name ?? loc.bookSlug
  return loc.verse ? `${name} ${loc.chapter}:${loc.verse}` : `${name} ${loc.chapter}`
}

export function lastReadTestament(loc: LastRead | null): Testament | null {
  return loc ? testamentOf(loc.bookSlug) : null
}

export function subscribeLastRead(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function useLastRead() {
  return useSyncExternalStore(subscribeLastRead, () => cached, () => null)
}
