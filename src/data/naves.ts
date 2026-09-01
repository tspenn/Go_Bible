import { useSyncExternalStore } from 'react'
import { findBook, parseRef } from './kjv'
import index from './naves-index.json' with { type: 'json' }

export type NaveTopic = {
  slug: string
  name: string
  summary: string
  refs: string[]
}

export type NaveRef = {
  bookSlug: string
  chapter: number
  verse: number
  verseEnd?: number
}

export type NaveDumpTopic = {
  slug: string
  name: string
  related: string[]
  subtopics: { label: string; refs: NaveRef[] }[]
}

export type NaveHit = NaveTopic & { hitLabel?: string }

export type NaveView = {
  slug: string
  name: string
  summary: string
  refs: string[]
  seed?: NaveTopic
  dump?: NaveDumpTopic
}

export const NAVES_SOURCE =
  'Nave’s Topical Bible, Orville J. Nave, 1896 (public domain).'

/** Seed from public-domain Nave’s structure. References only; verse text lives in KJV. */
export const TOPICS: NaveTopic[] = [
  {
    slug: 'faith',
    name: 'Faith',
    summary: 'Trust in God; the substance of things hoped for.',
    refs: ['John 3:16', 'Hebrews 11:1', 'Hebrews 11:6', 'Romans 10:17', '2 Corinthians 5:7'],
  },
  {
    slug: 'walking',
    name: 'Walking',
    summary: 'Walking with God; walking by faith rather than sight.',
    refs: ['2 Corinthians 5:7', 'Genesis 1:1'],
  },
  {
    slug: 'grace',
    name: 'Grace',
    summary: 'The unearned favor of God.',
    refs: ['John 1:1', 'John 3:16', 'James 1:17'],
  },
  {
    slug: 'prayer',
    name: 'Prayer',
    summary: 'Coming to God with care, need, and thanksgiving.',
    refs: ['Matthew 11:28', '1 Peter 5:7', 'Psalms 46:10'],
  },
  {
    slug: 'hope',
    name: 'Hope',
    summary: 'Quiet confidence in what God has promised.',
    refs: ['Hebrews 11:1', 'Isaiah 40:31', 'Romans 8:28'],
  },
  {
    slug: 'trust',
    name: 'Trust',
    summary: 'Leaning on the Lord rather than our own understanding.',
    refs: ['Proverbs 3:5', 'Proverbs 3:6', 'Psalms 23:1'],
  },
  {
    slug: 'gratitude',
    name: 'Gratitude',
    summary: 'Remembering every good gift comes from above.',
    refs: ['James 1:17', 'Psalms 23:1'],
  },
  {
    slug: 'home',
    name: 'Home',
    summary: 'The household as a place of rest and care.',
    refs: ['Psalms 23:2', 'John 14:1', 'John 14:27'],
  },
  {
    slug: 'sabbath',
    name: 'Sabbath',
    summary: 'Rest given by God; stilling the heart.',
    refs: ['Psalms 46:10', 'Matthew 11:28'],
  },
  {
    slug: 'garden',
    name: 'Garden',
    summary: 'Green places, still waters, and the care of the Shepherd.',
    refs: ['Psalms 23:2', 'Genesis 1:1', 'Matthew 6:26'],
  },
]

const SEED_SLUGS = new Set(TOPICS.map((t) => t.slug))

type TopicPayload = { source: string; topics: NaveDumpTopic[] }
type BookPayload = {
  source: string
  hits: { chapter: number; verse: number; topics: { slug: string; name: string; label: string }[] }[]
}

type IndexPayload = {
  source: string
  topics: { slug: string; name: string }[]
}

const INDEX = index as IndexPayload
const NAME_BY_SLUG = new Map(INDEX.topics.map((t) => [t.slug, t.name]))
for (const t of TOPICS) {
  if (!NAME_BY_SLUG.has(t.slug)) NAME_BY_SLUG.set(t.slug, t.name)
}

const letterLoaders = import.meta.glob('./naves-topics/*.json') as Record<
  string,
  () => Promise<{ default: TopicPayload } | TopicPayload>
>
const bookLoaders = import.meta.glob('./naves-books/*.json') as Record<
  string,
  () => Promise<{ default: BookPayload } | BookPayload>
>

const dumpBySlug = new Map<string, NaveDumpTopic>()
const verseHits = new Map<string, { slug: string; name: string; label: string }[]>()
const loadedLetters = new Set<string>()
const loadedBooks = new Set<string>()
const loading = new Map<string, Promise<void>>()
const listeners = new Set<() => void>()
let version = 0

function letterOf(slug: string) {
  const ch = slug[0]
  return ch && /[a-z]/.test(ch) ? ch : '0'
}

function verseKey(bookSlug: string, chapter: number, verse: number) {
  return `${bookSlug}:${chapter}:${verse}`
}

function bump() {
  version += 1
  listeners.forEach((fn) => fn())
}

function payload<T>(mod: { default?: T } | T) {
  return ((mod as { default?: T }).default ?? mod) as T
}

export function subscribeNaves(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function navesVersion() {
  return version
}

export function useNaves() {
  return useSyncExternalStore(subscribeNaves, navesVersion, () => 0)
}

export async function ensureNavesTopic(slug: string) {
  const letter = letterOf(slug)
  if (loadedLetters.has(letter)) return
  const path = `./naves-topics/${letter}.json`
  const loader = letterLoaders[path]
  if (!loader) {
    loadedLetters.add(letter)
    return
  }
  const key = `letter:${letter}`
  const pending = loading.get(key)
  if (pending) return pending
  const work = loader()
    .then((mod) => {
      const data = payload<TopicPayload>(mod)
      for (const t of data.topics ?? []) dumpBySlug.set(t.slug, t)
      loadedLetters.add(letter)
      bump()
    })
    .catch((err) => {
      console.warn(`Nave letter ${letter} failed to load`, err)
    })
    .finally(() => {
      loading.delete(key)
    })
  loading.set(key, work)
  return work
}

export async function ensureNavesBook(bookSlug: string) {
  if (loadedBooks.has(bookSlug)) return
  const path = `./naves-books/${bookSlug}.json`
  const loader = bookLoaders[path]
  if (!loader) {
    loadedBooks.add(bookSlug)
    return
  }
  const key = `book:${bookSlug}`
  const pending = loading.get(key)
  if (pending) return pending
  const work = loader()
    .then((mod) => {
      const data = payload<BookPayload>(mod)
      for (const hit of data.hits ?? []) {
        verseHits.set(verseKey(bookSlug, hit.chapter, hit.verse), hit.topics)
      }
      loadedBooks.add(bookSlug)
      bump()
    })
    .catch((err) => {
      console.warn(`Nave book ${bookSlug} failed to load`, err)
    })
    .finally(() => {
      loading.delete(key)
    })
  loading.set(key, work)
  return work
}

export function navesTopicReady(slug: string) {
  return SEED_SLUGS.has(slug) || loadedLetters.has(letterOf(slug))
}

export function findTopic(slug: string): NaveView | undefined {
  const seed = TOPICS.find((t) => t.slug === slug)
  const dump = dumpBySlug.get(slug)
  if (!seed && !dump) return undefined
  return {
    slug,
    name: seed?.name ?? dump?.name ?? slug,
    summary: seed?.summary ?? '',
    refs: seed?.refs ?? [],
    seed,
    dump,
  }
}

export function topicsForVerse(bookSlug: string, chapter: number, verse: number): NaveHit[] {
  const seedHits = TOPICS.filter((t) =>
    t.refs.some((r) => {
      const p = parseRef(r)
      return p?.bookSlug === bookSlug && p.chapter === chapter && p.verse === verse
    }),
  ).map((t) => ({ ...t }))
  const seen = new Set(seedHits.map((t) => t.slug))
  const dump = verseHits.get(verseKey(bookSlug, chapter, verse)) ?? []
  const extra: NaveHit[] = []
  for (const hit of dump) {
    if (seen.has(hit.slug)) continue
    seen.add(hit.slug)
    extra.push({
      slug: hit.slug,
      name: hit.name,
      summary: '',
      refs: [],
      hitLabel: hit.label,
    })
  }
  return [...seedHits, ...extra]
}

export function searchTopics(q: string): NaveTopic[] {
  const n = q.trim().toLowerCase()
  if (!n) return TOPICS
  const seedHits = TOPICS.filter(
    (t) =>
      t.name.toLowerCase().includes(n) ||
      t.summary.toLowerCase().includes(n) ||
      t.refs.some((r) => r.toLowerCase().includes(n)),
  )
  const seen = new Set(seedHits.map((t) => t.slug))
  const dumpHits: NaveTopic[] = []
  for (const t of INDEX.topics) {
    if (seen.has(t.slug)) continue
    if (!t.name.toLowerCase().includes(n) && !t.slug.includes(n.replace(/\s+/g, '-'))) continue
    dumpHits.push({ slug: t.slug, name: t.name, summary: '', refs: [] })
    if (dumpHits.length >= 80) break
  }
  return [...seedHits, ...dumpHits]
}

export function naveTopicName(slug: string) {
  return NAME_BY_SLUG.get(slug) ?? slug
}

export function formatNaveRef(ref: NaveRef) {
  const name = findBook(ref.bookSlug)?.name ?? ref.bookSlug
  if (ref.verseEnd && ref.verseEnd !== ref.verse) {
    return `${name} ${ref.chapter}:${ref.verse}–${ref.verseEnd}`
  }
  return `${name} ${ref.chapter}:${ref.verse}`
}

export function naveRefHref(ref: NaveRef) {
  return `/bible/${ref.bookSlug}/${ref.chapter}/${ref.verse}`
}
