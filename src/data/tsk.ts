import raw from './tsk.json' with { type: 'json' }
import { bookName } from './kjv'

export const TSK_SOURCE = 'Treasury of Scripture Knowledge, public domain'

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

const data = raw as Payload
export const TSK_SOURCE_NOTE = data.source

const byVerse = new Map<string, TskGroup[]>()
for (const g of data.groups) {
  const key = `${g.bookSlug}:${g.chapter}:${g.verse}`
  const list = byVerse.get(key) ?? []
  list.push(g)
  byVerse.set(key, list)
}
for (const list of byVerse.values()) {
  list.sort((a, b) => a.sortOrder - b.sortOrder)
}

export const TSK_PREVIEW = 6

export function tskForVerse(bookSlug: string, chapter: number, verse: number) {
  return byVerse.get(`${bookSlug}:${chapter}:${verse}`) ?? []
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
