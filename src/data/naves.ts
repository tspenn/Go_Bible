import { useSyncExternalStore } from 'react'
import { expandSearchTerms, nameMatchesTerm, skipTopicKeys } from '../lib/searchTerms'
import { findBook, findVerse, parseRef, type Verse } from './kjv'
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

/** Seed from public-domain Nave’s structure. Topic pages print the Go-Bible verse text. */
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
  topics: { slug: string; name: string; keys?: string }[]
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

function topicMatches(
  t: { slug: string; name: string; keys?: string },
  term: string,
  loose: boolean,
) {
  if (nameMatchesTerm(t.name, term, loose)) return true
  if (t.slug === term) return true
  if (loose && t.slug.includes(term.replace(/\s+/g, '-'))) return true
  if (t.keys && !skipTopicKeys(term) && nameMatchesTerm(t.keys, term, loose)) return true
  return false
}

export function searchTopics(q: string): NaveTopic[] {
  const terms = expandSearchTerms(q)
  const original = terms[0] ?? ''
  if (!original) return TOPICS
  const seedHits = TOPICS.filter((t) =>
    terms.some((n, i) => {
      const loose = i === 0
      return (
        topicMatches(t, n, loose) ||
        (loose && t.summary.toLowerCase().includes(n)) ||
        (loose && t.refs.some((r) => r.toLowerCase().includes(n)))
      )
    }),
  )
  const seen = new Set(seedHits.map((t) => t.slug))
  const dumpHits: NaveTopic[] = []
  for (const t of INDEX.topics) {
    if (seen.has(t.slug)) continue
    const hit = terms.some((n, i) => topicMatches(t, n, i === 0))
    if (!hit) continue
    dumpHits.push({ slug: t.slug, name: t.name, summary: '', refs: [] })
    if (dumpHits.length >= 80) break
  }
  dumpHits.sort((a, b) => topicRank(a.name, terms) - topicRank(b.name, terms) || a.name.localeCompare(b.name))
  return [...seedHits, ...dumpHits]
}

function topicRank(name: string, terms: string[]) {
  const n = name.toLowerCase()
  let best = 99
  for (let i = 0; i < terms.length; i++) {
    const t = terms[i]
    if (!t) continue
    let s = 6
    if (n === t) s = 0
    else if (n.startsWith(t)) s = 1
    else if (nameMatchesTerm(name, t, false)) s = 2
    else if (n.includes(t)) s = 4
    const w = s + i * 0.02
    if (w < best) best = w
  }
  return best
}

const FEATURED_ONE_WORDS = [
  'Jesus',
  'Salvation',
  'Faith',
  'Church',
  'God',
  'Gospel',
  'Prayer',
  'Grace',
  'Hope',
  'Love',
  'Atonement',
  'Forgiveness',
  'Resurrection',
  'Judgment',
  'Repentance',
  'Spirit',
]

const FEATURED_SET = new Set(FEATURED_ONE_WORDS)

function isOneWord(name: string) {
  return /^[\p{L}']+$/u.test(name.trim())
}

let oneWordNames: string[] | undefined

function allOneWordNames() {
  if (!oneWordNames) {
    const set = new Set<string>(FEATURED_ONE_WORDS)
    for (const t of TOPICS) {
      if (isOneWord(t.name)) set.add(t.name)
    }
    for (const t of INDEX.topics) {
      if (isOneWord(t.name)) set.add(t.name)
    }
    oneWordNames = [...set]
  }
  return oneWordNames
}

export function featuredOneWords() {
  return FEATURED_ONE_WORDS
}

/** One-word Nave headwords and featured topics for the Topics search bar. */
export function oneWordSuggestions(q: string, limit = 8): string[] {
  const n = q.trim().toLowerCase()
  if (!n) return FEATURED_ONE_WORDS
  const starts: string[] = []
  const rest: string[] = []
  for (const name of allOneWordNames()) {
    const low = name.toLowerCase()
    if (low === n) continue
    if (low.startsWith(n)) starts.push(name)
    else if (n.length >= 2 && low.includes(n)) rest.push(name)
  }
  const rank = (a: string, b: string) => {
    const fa = FEATURED_SET.has(a)
    const fb = FEATURED_SET.has(b)
    if (fa !== fb) return fa ? -1 : 1
    return a.localeCompare(b)
  }
  starts.sort(rank)
  rest.sort(rank)
  return [...starts, ...rest].slice(0, limit)
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

export function versesForNaveRef(ref: NaveRef): Verse[] {
  const end = Math.max(ref.verse, ref.verseEnd ?? ref.verse)
  const out: Verse[] = []
  for (let v = ref.verse; v <= end; v++) {
    const found = findVerse(ref.bookSlug, ref.chapter, v)
    if (found) out.push(found)
  }
  return out
}

function dumpRefCount(dump: NaveDumpTopic) {
  return dump.subtopics.reduce((n, s) => n + s.refs.length, 0)
}

function refsFromDump(dump: NaveDumpTopic, limit: number): NaveRef[] {
  const general = dump.subtopics.filter((s) => /general scriptures/i.test(s.label))
  const rest = dump.subtopics.filter((s) => !/general scriptures/i.test(s.label))
  const out: NaveRef[] = []
  const seen = new Set<string>()
  for (const sub of [...general, ...rest]) {
    for (const ref of sub.refs) {
      const key = `${ref.bookSlug}:${ref.chapter}:${ref.verse}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(ref)
      if (out.length >= limit) return out
    }
  }
  return out
}

function pushVerse(verses: Verse[], seen: Set<string>, found: Verse | undefined, limit: number) {
  if (!found) return false
  const key = `${found.bookSlug}:${found.chapter}:${found.verse}`
  if (seen.has(key)) return false
  seen.add(key)
  verses.push(found)
  return verses.length >= limit
}

/** Verses Nave lists under matching topics. Follows empty “see also” heads one hop. */
export type NaveReading = { slug: string; name: string }

function isReadableTopic(slug: string, typed: string) {
  const dump = dumpBySlug.get(slug)
  if (dump) {
    const n = dumpRefCount(dump)
    if (n === 0) return false
    if (n > 80 && !nameMatchesTerm(dump.name, typed, true)) return false
    return true
  }
  const seed = TOPICS.find((t) => t.slug === slug)
  return Boolean(seed && seed.refs.length)
}

export async function versesFromNaveTopics(
  slugs: string[],
  q: string,
  limit = 8,
): Promise<{ verses: Verse[]; reading: NaveReading[] }> {
  const unique = [...new Set(slugs.filter(Boolean))].slice(0, 8)
  await Promise.all(unique.map((s) => ensureNavesTopic(s)))
  const hop: string[] = []
  for (const slug of unique) {
    const dump = dumpBySlug.get(slug)
    if (dump && dumpRefCount(dump) === 0) hop.push(...dump.related)
  }
  const extra = [...new Set(hop)].filter((s) => !unique.includes(s)).slice(0, 8)
  await Promise.all(extra.map((s) => ensureNavesTopic(s)))
  const typed = q.trim().toLowerCase()
  const ranked = [...unique, ...extra].sort((a, b) => {
    const da = dumpBySlug.get(a)
    const db = dumpBySlug.get(b)
    const na = da ? dumpRefCount(da) : 0
    const nb = db ? dumpRefCount(db) : 0
    const aHuge = na > 80 && !nameMatchesTerm(naveTopicName(a), typed, true)
    const bHuge = nb > 80 && !nameMatchesTerm(naveTopicName(b), typed, true)
    if (aHuge !== bHuge) return aHuge ? 1 : -1
    const aEmpty = na === 0 && !TOPICS.some((t) => t.slug === a)
    const bEmpty = nb === 0 && !TOPICS.some((t) => t.slug === b)
    if (aEmpty !== bEmpty) return aEmpty ? 1 : -1
    return 0
  })
  const hopSet = new Set(hop)
  const reading: NaveReading[] = []
  for (const slug of ranked) {
    if (!isReadableTopic(slug, typed)) continue
    const name = dumpBySlug.get(slug)?.name ?? naveTopicName(slug)
    if (!nameMatchesTerm(name, typed, true) && !hopSet.has(slug)) continue
    if (reading.some((r) => r.slug === slug)) continue
    reading.push({ slug, name })
    if (reading.length >= 3) break
  }
  const verses: Verse[] = []
  const seen = new Set<string>()
  for (const slug of ranked) {
    const seed = TOPICS.find((t) => t.slug === slug)
    if (seed) {
      for (const r of seed.refs) {
        const p = parseRef(r)
        if (!p) continue
        if (pushVerse(verses, seen, findVerse(p.bookSlug, p.chapter, p.verse), limit)) {
          return { verses, reading }
        }
      }
    }
    const dump = dumpBySlug.get(slug)
    if (!dump) continue
    const tooBig = dumpRefCount(dump) > 80 && !nameMatchesTerm(dump.name, typed, true)
    if (tooBig) continue
    for (const ref of refsFromDump(dump, limit)) {
      if (pushVerse(verses, seen, findVerse(ref.bookSlug, ref.chapter, ref.verse), limit)) {
        return { verses, reading }
      }
    }
  }
  return { verses, reading }
}
