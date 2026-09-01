import { useSyncExternalStore } from 'react'
import seed from './tsk.json' with { type: 'json' }
import { bookName } from './kjv'

export const TSK_SOURCE = 'Treasury of Scripture Knowledge (ca. 1880). Public domain.'

export type TskRef = {
  bookSlug: string
  chapter: number
  verse: number
  verseEnd?: number
}

export type TskGroup = {
  bookSlug: string
  chapter: number
  verse: number
  sortOrder: number
  kjvPhrase: string
  webPhrase: string
  refs: TskRef[]
}

type Payload = {
  source: string
  groups: TskGroup[]
}

const bookLoaders = import.meta.glob('./tsk-books/*.json') as Record<
  string,
  () => Promise<{ default: Payload } | Payload>
>

const byVerse = new Map<string, TskGroup[]>()
const loadedBooks = new Set<string>()
const loading = new Map<string, Promise<void>>()
const listeners = new Set<() => void>()
let version = 0

function verseKey(bookSlug: string, chapter: number, verse: number) {
  return `${bookSlug}:${chapter}:${verse}`
}

function addGroups(groups: TskGroup[], replaceBook?: string) {
  if (replaceBook) {
    const prefix = `${replaceBook}:`
    for (const key of [...byVerse.keys()]) {
      if (key.startsWith(prefix)) byVerse.delete(key)
    }
  }
  const touched = new Set<string>()
  for (const g of groups) {
    const key = verseKey(g.bookSlug, g.chapter, g.verse)
    const list = byVerse.get(key) ?? []
    list.push(g)
    byVerse.set(key, list)
    touched.add(key)
  }
  for (const key of touched) {
    byVerse.get(key)?.sort((a, b) => a.sortOrder - b.sortOrder)
  }
  version += 1
  listeners.forEach((fn) => fn())
}

const seedData = seed as Payload
export const TSK_SOURCE_NOTE = seedData.source
addGroups(seedData.groups)

export const TSK_PREVIEW = 6

export function subscribeTsk(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function tskVersion() {
  return version
}

export async function ensureTskBook(bookSlug: string) {
  if (loadedBooks.has(bookSlug)) return
  const path = `./tsk-books/${bookSlug}.json`
  const loader = bookLoaders[path]
  if (!loader) {
    loadedBooks.add(bookSlug)
    return
  }
  const pending = loading.get(bookSlug)
  if (pending) return pending
  const work = loader()
    .then((mod) => {
      const payload = (mod as { default?: Payload }).default ?? (mod as Payload)
      addGroups(payload.groups ?? [], bookSlug)
      loadedBooks.add(bookSlug)
    })
    .catch((err) => {
      console.warn(`TSK book ${bookSlug} failed to load`, err)
    })
    .finally(() => {
      loading.delete(bookSlug)
    })
  loading.set(bookSlug, work)
  return work
}

export function tskForVerse(bookSlug: string, chapter: number, verse: number) {
  return byVerse.get(verseKey(bookSlug, chapter, verse)) ?? []
}

export function tskLinkCount(groups: TskGroup[]) {
  return groups.reduce((n, g) => n + g.refs.length, 0)
}

export function tskPreview(groups: TskGroup[], expanded: boolean) {
  if (expanded) return groups
  let left = TSK_PREVIEW
  const out: TskGroup[] = []
  for (const g of groups) {
    if (left <= 0) break
    const refs = g.refs.slice(0, left)
    if (refs.length === 0) continue
    out.push({ ...g, refs })
    left -= refs.length
  }
  return out
}

export function tskHref(ref: TskRef) {
  return `/bible/${ref.bookSlug}/${ref.chapter}/${ref.verse}`
}

export function formatTskRef(ref: TskRef) {
  const name = bookName(ref.bookSlug)
  if (ref.verseEnd && ref.verseEnd !== ref.verse) {
    return `${name} ${ref.chapter}:${ref.verse}–${ref.verseEnd}`
  }
  return `${name} ${ref.chapter}:${ref.verse}`
}

export function tskHeading(group: TskGroup) {
  return group.webPhrase || group.kjvPhrase
}

export function useTsk() {
  useSyncExternalStore(subscribeTsk, tskVersion, () => 0)
}
