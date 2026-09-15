import { boostedScriptureRefs, commentarySearchTerms, hayMatches, scriptureSearchTerms } from '../lib/searchTerms'
import { DICTIONARY, type DictEntry } from './dictionary'
import { ensureHenryBook, henryNotesForVerse, SEED_NOTES } from './henry'
import { bookName, findVerse, searchVerses, type Verse } from './kjv'
import { featuredOneWords, searchTopics, versesFromNaveTopics, type NaveReading } from './naves'
import { ensureScofieldBook, notesForVerse, SCOFIELD } from './scofield'
import { MORE_NAVE_STARTERS, MORE_STARTERS, STARTER_TOPICS, type StarterTopic } from './starters'

export type StudySource = 'scripture' | 'naves' | 'scofield' | 'henry' | 'tsk' | 'easton'

export type StudyHit = {
  source: StudySource
  title: string
  detail: string
  href: string
  full?: boolean
}

export type StudyResults = Record<StudySource, StudyHit[]> & { naveMore: NaveReading[] }

type ScoRow = { t: string; b: string; c: number; v: number; s: string }
type HenryRow = { b: string; c: number; v: number; r: string; s: string; h: string }
type TskRow = { t: string; b: string; c: number; v: number }

const empty = (): StudyResults => ({
  scripture: [],
  naves: [],
  scofield: [],
  henry: [],
  tsk: [],
  easton: [],
  naveMore: [],
})

function clip(s: string, n: number) {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= n) return t
  return `${t.slice(0, n).trim()}…`
}

function plain(s: string) {
  return s.replace(/\s+/g, ' ').trim()
}

const ALL_STARTERS: StarterTopic[] = [...STARTER_TOPICS, ...MORE_STARTERS, ...MORE_NAVE_STARTERS]

/** Featured Topics chips → the Scofield note already picked for that word. */
const CHIP_STARTER_ID: Record<string, string> = {
  jesus: 'jesus',
  salvation: 'salvation',
  faith: 'faith',
  church: 'church',
  god: 'god',
  gospel: 'believe',
  prayer: 'prayer',
  grace: 'grace',
  hope: 'hope',
  love: 'love',
  atonement: 'atonement',
  forgiveness: 'forgiveness',
  resurrection: 'resurrection',
  judgment: 'judgment',
  judgement: 'judgment',
  repentance: 'repentance',
  spirit: 'holy-spirit',
}

/** Scofield 1917 Summary notes: the chain-end write-up for the whole topic, not a word-hit. */
const CHIP_SCOFIELD_SUMMARY: Record<string, { bookSlug: string; chapter: number; verse: number; heading: string; title: string }[]> =
  {
    jesus: [{ bookSlug: 'john', chapter: 20, verse: 28, heading: 'My Lord and My God', title: 'Deity of Jesus Christ' }],
    salvation: [{ bookSlug: 'romans', chapter: 1, verse: 16, heading: 'salvation', title: 'Salvation' }],
    faith: [{ bookSlug: 'hebrews', chapter: 11, verse: 39, heading: 'faith', title: 'Faith' }],
    church: [{ bookSlug: 'hebrews', chapter: 12, verse: 23, heading: 'church', title: 'Church (true)' }],
    god: [{ bookSlug: 'malachi', chapter: 3, verse: 18, heading: 'God', title: 'God' }],
    gospel: [{ bookSlug: 'revelation', chapter: 14, verse: 6, heading: 'gospel', title: 'Gospel' }],
    prayer: [{ bookSlug: 'luke', chapter: 11, verse: 1, heading: 'teach us to pray', title: 'Prayer' }],
    grace: [{ bookSlug: 'john', chapter: 1, verse: 17, heading: 'grace', title: 'Grace' }],
    love: [{ bookSlug: '2-john', chapter: 1, verse: 5, heading: 'that we love one another', title: 'Law of Christ' }],
    atonement: [{ bookSlug: 'leviticus', chapter: 16, verse: 6, heading: 'Atonement', title: 'Atonement' }],
    forgiveness: [{ bookSlug: 'matthew', chapter: 26, verse: 28, heading: 'remission', title: 'Forgiveness' }],
    resurrection: [{ bookSlug: '1-corinthians', chapter: 15, verse: 52, heading: 'raised', title: 'Resurrection' }],
    judgment: [{ bookSlug: 'revelation', chapter: 20, verse: 12, heading: 'judged', title: 'Judgment' }],
    judgement: [{ bookSlug: 'revelation', chapter: 20, verse: 12, heading: 'judged', title: 'Judgment' }],
    repentance: [{ bookSlug: 'acts', chapter: 17, verse: 30, heading: 'Repent', title: 'Repentance' }],
    spirit: [{ bookSlug: 'acts', chapter: 2, verse: 4, heading: 'Holy Ghost', title: 'Holy Spirit' }],
  }

function teachingStarter(q: string): StarterTopic | undefined {
  const n = q.trim().toLowerCase()
  const id = CHIP_STARTER_ID[n]
  if (id) return ALL_STARTERS.find((t) => t.id === id)
  return ALL_STARTERS.find((t) => t.naveName.toLowerCase() === n || t.naveSlug === n)
}

function isChipQuery(q: string) {
  const n = q.trim().toLowerCase()
  if (CHIP_STARTER_ID[n]) return true
  return featuredOneWords().some((w) => w.toLowerCase() === n)
}

function verseLabel(bookSlug: string, chapter: number, verse: number) {
  return `${bookName(bookSlug)} ${chapter}:${verse}`
}

function verseHref(bookSlug: string, chapter: number, verse: number, tab: string) {
  return `/bible/${bookSlug}/${chapter}/${verse}?tab=${tab}`
}

function scoreTitle(title: string, terms: string[]) {
  const t = title.toLowerCase()
  let best = 99
  for (let i = 0; i < terms.length; i++) {
    const q = terms[i]
    if (!q) continue
    let s = 4
    if (t === q) s = 0
    else if (t.startsWith(q)) s = 1
    else if (t.includes(q)) s = 2
    const weighted = s + i * 0.05
    if (weighted < best) best = weighted
  }
  return best
}

let scofieldRows: ScoRow[] | null = null
let henryRows: HenryRow[] | null = null
let tskRows: TskRow[] | null = null
let loading: Promise<void> | null = null

function payloadRows<T>(mod: unknown): T[] {
  const m = mod as { default?: { rows?: T[] }; rows?: T[] }
  return m.default?.rows ?? m.rows ?? []
}

async function loadIndexes() {
  if (scofieldRows && henryRows && tskRows) return
  if (loading) return loading
  loading = Promise.all([
    import('./search-scofield.json'),
    import('./search-henry.json'),
    import('./search-tsk.json'),
  ]).then(([sco, hen, tsk]) => {
    scofieldRows = payloadRows<ScoRow>(sco)
    henryRows = payloadRows<HenryRow>(hen)
    tskRows = payloadRows<TskRow>(tsk)
  })
  await loading
}

function eastonHit(d: DictEntry): StudyHit {
  const source = d.source === 'Smith' ? 'Smith' : 'Easton, 1897'
  return {
    source: 'easton',
    title: d.name,
    detail: `${source}. ${plain(d.body)}`,
    href: '',
    full: true,
  }
}

function dictRank(d: DictEntry, n: string) {
  const name = d.name.toLowerCase()
  const slug = d.slug.toLowerCase()
  if (name === n || slug === n) return 0
  if (d.aliases.some((a) => a.toLowerCase() === n)) return 0
  if (name.startsWith(`${n} `) || name.startsWith(`${n},`)) return 1
  const words = name.split(/[^a-z]+/).filter(Boolean)
  if (words.includes(n)) return 2
  if (name.startsWith(n)) return 3
  return 9
}

function searchEaston(q: string, limit: number, exact = false): StudyHit[] {
  const n = q.trim().toLowerCase()
  if (n.length < 2) return []
  const ranked = DICTIONARY.map((d) => ({ d, rank: dictRank(d, n) })).filter((x) => x.rank < (exact ? 1 : 9))
  ranked.sort((a, b) => a.rank - b.rank || a.d.name.localeCompare(b.d.name))
  const hits: StudyHit[] = []
  const seen = new Set<string>()
  for (const { d } of ranked) {
    if (seen.has(d.slug)) continue
    seen.add(d.slug)
    hits.push(eastonHit(d))
    if (hits.length >= limit) return hits
  }
  return hits
}

async function chipScofieldSummaries(q: string): Promise<StudyHit[]> {
  const rows = CHIP_SCOFIELD_SUMMARY[q.trim().toLowerCase()]
  if (!rows?.length) return []
  await Promise.all(rows.map((r) => ensureScofieldBook(r.bookSlug)))
  const hits: StudyHit[] = []
  for (const r of rows) {
    const notes = notesForVerse(r.bookSlug, r.chapter, r.verse)
    const want = r.heading.toLowerCase()
    const match = notes.find((n) => (n.heading || n.kjvPhrase).toLowerCase() === want)
    if (!match) continue
    hits.push(scoHit(r.title, match.bookSlug, match.chapter, match.verse, match.body, true))
  }
  return hits
}

function scoHit(title: string, bookSlug: string, chapter: number, verse: number, body: string, full: boolean): StudyHit {
  return {
    source: 'scofield',
    title: `${title} · ${verseLabel(bookSlug, chapter, verse)}`,
    detail: plain(body),
    href: verseHref(bookSlug, chapter, verse, 'scofield'),
    full,
  }
}

function henryHit(bookSlug: string, chapter: number, verse: number, range: string, body: string, full: boolean): StudyHit {
  const extra = range && range !== String(verse) ? ` (${range})` : ''
  return {
    source: 'henry',
    title: `${verseLabel(bookSlug, chapter, verse)}${extra}`,
    detail: plain(body),
    href: verseHref(bookSlug, chapter, verse, 'henry'),
    full,
  }
}

function searchScofield(terms: string[], limit: number): StudyHit[] {
  const hits: StudyHit[] = []
  const seen = new Set<string>()
  for (const n of SCOFIELD) {
    const title = n.heading || n.kjvPhrase
    const hay = `${title} ${n.body} ${n.kjvPhrase} ${n.webPhrase}`
    if (!hayMatches(hay, terms)) continue
    const key = `${n.bookSlug}:${n.chapter}:${n.verse}:${title.toLowerCase()}`
    seen.add(key)
    hits.push(scoHit(title, n.bookSlug, n.chapter, n.verse, n.body, true))
  }
  const extra = (scofieldRows ?? [])
    .filter((r) => {
      if (/^(writer|date|theme|title)$/i.test(r.t)) return false
      return hayMatches(`${r.t} ${r.s}`, terms)
    })
    .sort((a, b) => scoreTitle(a.t, terms) - scoreTitle(b.t, terms))
  for (const r of extra) {
    const key = `${r.b}:${r.c}:${r.v}:${r.t.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    hits.push(scoHit(r.t, r.b, r.c, r.v, r.s, false))
    if (hits.length >= limit) break
  }
  return hits.slice(0, limit)
}

function searchHenry(terms: string[], limit: number): StudyHit[] {
  const hits: StudyHit[] = []
  const seen = new Set<string>()
  for (const n of SEED_NOTES) {
    if (!hayMatches(n.body, terms)) continue
    const key = `${n.bookSlug}:${n.chapter}:${n.verse}:${n.range ?? ''}`
    seen.add(key)
    hits.push(henryHit(n.bookSlug, n.chapter, n.verse, n.range ?? '', n.body, true))
  }
  const dump = henryRows ?? []
  const ranked = dump
    .filter((r) => hayMatches(`${r.h} ${r.s}`, terms))
    .sort((a, b) => Number(hayMatches(b.s, terms)) - Number(hayMatches(a.s, terms)))
  for (const r of ranked) {
    const key = `${r.b}:${r.c}:${r.v}:${r.r}`
    if (seen.has(key)) continue
    seen.add(key)
    hits.push(henryHit(r.b, r.c, r.v, r.r, r.s, false))
    if (hits.length >= limit) break
  }
  return hits.slice(0, limit)
}

async function hydrateScofield(hits: StudyHit[]): Promise<StudyHit[]> {
  const books = new Set<string>()
  for (const h of hits) {
    const m = h.href.match(/^\/bible\/([^/]+)\/(\d+)\/(\d+)/)
    if (m) books.add(m[1]!)
  }
  await Promise.all([...books].map((b) => ensureScofieldBook(b)))
  return hits.map((h) => {
    const m = h.href.match(/^\/bible\/([^/]+)\/(\d+)\/(\d+)/)
    if (!m) return h
    const bookSlug = m[1]!
    const chapter = Number(m[2])
    const verse = Number(m[3])
    const notes = notesForVerse(bookSlug, chapter, verse)
    const heading = h.title.split(' · ')[0]?.toLowerCase() ?? ''
    const match =
      notes.find((n) => (n.heading || n.kjvPhrase).toLowerCase() === heading) ?? notes[0]
    if (!match) return h
    return scoHit(match.heading || match.kjvPhrase, bookSlug, chapter, verse, match.body, true)
  })
}

async function hydrateHenry(hits: StudyHit[]): Promise<StudyHit[]> {
  const books = new Set<string>()
  for (const h of hits) {
    const m = h.href.match(/^\/bible\/([^/]+)\/(\d+)\/(\d+)/)
    if (m) books.add(m[1]!)
  }
  await Promise.all([...books].map((b) => ensureHenryBook(b)))
  return hits.map((h) => {
    const m = h.href.match(/^\/bible\/([^/]+)\/(\d+)\/(\d+)/)
    if (!m) return h
    const bookSlug = m[1]!
    const chapter = Number(m[2])
    const verse = Number(m[3])
    const range = h.title.match(/\(([^)]+)\)\s*$/)?.[1]
    const notes = henryNotesForVerse(bookSlug, chapter, verse)
    const match =
      (range ? notes.find((n) => n.range === range) : undefined) ??
      notes.find((n) => n.range !== 'intro') ??
      notes[0]
    if (!match) return h
    return henryHit(match.bookSlug, match.chapter, match.verse, match.range ?? '', match.body, true)
  })
}

async function pinTeachingNotes(
  q: string,
  sco: StudyHit[],
  hen: StudyHit[],
  pin: { sco?: boolean; hen?: boolean } = {},
) {
  const teach = teachingStarter(q)
  if (!teach) return { sco, hen }
  const pinSco = pin.sco !== false
  const pinHen = pin.hen !== false
  const { bookSlug, chapter, verse, label } = teach.scofield
  await Promise.all([ensureScofieldBook(bookSlug), ensureHenryBook(bookSlug)])
  if (pinSco) {
    const want = label.toLowerCase()
    const scoNotes = notesForVerse(bookSlug, chapter, verse)
    const scoPick =
      scoNotes.find((n) => (n.heading || n.kjvPhrase).toLowerCase() === want) ??
      scoNotes.find((n) => !/^(writer|date|theme|title)$/i.test(n.heading || '')) ??
      scoNotes[0]
    if (scoPick) {
      const hit = scoHit(scoPick.heading || scoPick.kjvPhrase, bookSlug, chapter, verse, scoPick.body, true)
      sco = [hit, ...sco.filter((h) => h.href !== hit.href)]
    }
  }
  if (pinHen) {
    const henNotes = henryNotesForVerse(bookSlug, chapter, verse).filter((n) => n.range !== 'intro')
    if (henNotes[0]) {
      const n = henNotes[0]
      const hit = henryHit(n.bookSlug, n.chapter, n.verse, n.range ?? '', n.body, true)
      hen = [hit, ...hen.filter((h) => h.href !== hit.href)]
    }
  }
  return { sco, hen }
}

function searchTsk(terms: string[], limit: number): StudyHit[] {
  const extra = (tskRows ?? [])
    .filter((r) => hayMatches(r.t, terms))
    .sort((a, b) => scoreTitle(a.t, terms) - scoreTitle(b.t, terms) || a.t.length - b.t.length)
  return extra.slice(0, limit).map((r) => ({
    source: 'tsk' as const,
    title: r.t,
    detail: verseLabel(r.b, r.c, r.v),
    href: verseHref(r.b, r.c, r.v, 'tsk'),
  }))
}

export async function searchStudy(q: string): Promise<StudyResults> {
  const n = q.trim().toLowerCase()
  const out = empty()
  if (n.length < 2) return out
  const notesTerms = commentarySearchTerms(q)
  await loadIndexes()
  const topics = searchTopics(q)
  const chip = isChipQuery(q)
  const pinned = boostedScriptureRefs(q)
    .map((r) => findVerse(r.bookSlug, r.chapter, r.verse))
    .filter((v): v is Verse => Boolean(v))
  const fromText = chip ? [] : searchVerses(scriptureSearchTerms(q), 20)
  const seen = new Set(pinned.map((v) => `${v.bookSlug}:${v.chapter}:${v.verse}`))
  const textExtra = fromText.filter((v) => !seen.has(`${v.bookSlug}:${v.chapter}:${v.verse}`))
  for (const v of textExtra) seen.add(`${v.bookSlug}:${v.chapter}:${v.verse}`)
  const { verses: fromNave, reading } = await versesFromNaveTopics(
    (() => {
      const teach = teachingStarter(q)
      if (chip && teach) return [teach.naveSlug]
      return topics.slice(0, 6).map((t) => t.slug)
    })(),
    q,
    16,
  )
  const extra = chip ? [] : fromNave.filter((v) => !seen.has(`${v.bookSlug}:${v.chapter}:${v.verse}`))
  out.scripture = [...pinned, ...textExtra, ...extra].map((v) => ({
    source: 'scripture',
    title: `${v.book} ${v.chapter}:${v.verse}`,
    detail: clip(v.text, 180),
    href: `/bible/${v.bookSlug}/${v.chapter}/${v.verse}`,
  }))
  out.naveMore = reading
  const naveVerses = fromNave.map((v) => ({
    source: 'naves' as const,
    title: `${v.book} ${v.chapter}:${v.verse}`,
    detail: v.text,
    href: `/bible/${v.bookSlug}/${v.chapter}/${v.verse}`,
    full: true,
  }))
  const naveNames = topics.slice(0, 16).map((t) => ({
    source: 'naves' as const,
    title: t.name,
    detail: t.summary,
    href: `/topics/${t.slug}`,
  }))
  out.naves = [...naveVerses, ...naveNames]
  if (chip) {
    const summaries = await chipScofieldSummaries(q)
    const pinnedNotes = await pinTeachingNotes(q, summaries, [], { sco: summaries.length === 0 })
    out.scofield = pinnedNotes.sco
    out.henry = pinnedNotes.hen
    out.tsk = []
    out.easton = searchEaston(q, 2, true)
    return out
  }
  let sco = searchScofield(notesTerms, 8)
  let hen = searchHenry(notesTerms, 6)
  sco = await hydrateScofield(sco)
  hen = await hydrateHenry(hen)
  const pinnedNotes = await pinTeachingNotes(q, sco, hen)
  out.scofield = pinnedNotes.sco
  out.henry = pinnedNotes.hen
  out.tsk = searchTsk(notesTerms, 12)
  out.easton = searchEaston(q, 6)
  return out
}

export const STUDY_LABELS: Record<StudySource, string> = {
  scripture: 'Scripture',
  naves: "Nave’s",
  scofield: 'Scofield',
  henry: 'Matthew Henry',
  tsk: 'See also',
  easton: 'Dictionary',
}

export const STUDY_ORDER: StudySource[] = ['easton', 'scofield', 'henry', 'naves', 'tsk', 'scripture']
