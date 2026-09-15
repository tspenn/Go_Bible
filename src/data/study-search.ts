import { commentarySearchTerms, hayMatches, scriptureSearchTerms } from '../lib/searchTerms'
import { searchDictionary, type DictEntry } from './dictionary'
import { SEED_NOTES } from './henry'
import { bookName, searchVerses } from './kjv'
import { searchTopics, versesFromNaveTopics, type NaveReading } from './naves'
import { SCOFIELD } from './scofield'

export type StudySource = 'scripture' | 'naves' | 'scofield' | 'henry' | 'tsk' | 'easton'

export type StudyHit = {
  source: StudySource
  title: string
  detail: string
  href: string
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
  return {
    source: 'easton',
    title: d.name,
    detail: clip(`${d.source === 'Smith' ? 'Smith' : 'Easton, 1897'}. ${d.body}`, 180),
    href: '',
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
    hits.push({
      source: 'scofield',
      title,
      detail: `${verseLabel(n.bookSlug, n.chapter, n.verse)} — ${clip(n.body, 140)}`,
      href: verseHref(n.bookSlug, n.chapter, n.verse, 'scofield'),
    })
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
    hits.push({
      source: 'scofield',
      title: r.t,
      detail: `${verseLabel(r.b, r.c, r.v)} — ${r.s}`,
      href: verseHref(r.b, r.c, r.v, 'scofield'),
    })
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
    hits.push({
      source: 'henry',
      title: verseLabel(n.bookSlug, n.chapter, n.verse),
      detail: clip(n.body, 180),
      href: verseHref(n.bookSlug, n.chapter, n.verse, 'henry'),
    })
  }
  const dump = henryRows ?? []
  const ranked = dump
    .filter((r) => hayMatches(`${r.h} ${r.s}`, terms))
    .sort((a, b) => Number(hayMatches(b.s, terms)) - Number(hayMatches(a.s, terms)))
  for (const r of ranked) {
    const key = `${r.b}:${r.c}:${r.v}:${r.r}`
    if (seen.has(key)) continue
    seen.add(key)
    const range = r.r && r.r !== String(r.v) ? ` (${r.r})` : ''
    hits.push({
      source: 'henry',
      title: `${verseLabel(r.b, r.c, r.v)}${range}`,
      detail: r.s,
      href: verseHref(r.b, r.c, r.v, 'henry'),
    })
    if (hits.length >= limit) break
  }
  return hits.slice(0, limit)
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

function searchEaston(terms: string[], limit: number): StudyHit[] {
  const seen = new Set<string>()
  const hits: StudyHit[] = []
  for (let i = 0; i < terms.length; i++) {
    const term = terms[i]
    if (!term) continue
    for (const d of searchDictionary(term, limit, i > 0)) {
      if (seen.has(d.slug)) continue
      seen.add(d.slug)
      hits.push(eastonHit(d))
      if (hits.length >= limit) return hits
    }
  }
  return hits
}

export async function searchStudy(q: string): Promise<StudyResults> {
  const n = q.trim().toLowerCase()
  const out = empty()
  if (n.length < 2) return out
  const notesTerms = commentarySearchTerms(q)
  await loadIndexes()
  const topics = searchTopics(q)
  const fromText = searchVerses(scriptureSearchTerms(q), 20)
  const seen = new Set(fromText.map((v) => `${v.bookSlug}:${v.chapter}:${v.verse}`))
  const { verses: fromNave, reading } = await versesFromNaveTopics(
    topics.slice(0, 6).map((t) => t.slug),
    q,
    8,
  )
  const extra = fromNave.filter((v) => !seen.has(`${v.bookSlug}:${v.chapter}:${v.verse}`))
  out.scripture = [...fromText, ...extra].map((v) => ({
    source: 'scripture',
    title: `${v.book} ${v.chapter}:${v.verse}`,
    detail: clip(v.text, 180),
    href: `/bible/${v.bookSlug}/${v.chapter}/${v.verse}`,
  }))
  out.naveMore = reading
  out.naves = topics.slice(0, 20).map((t) => ({
    source: 'naves',
    title: t.name,
    detail: t.summary,
    href: `/topics/${t.slug}`,
  }))
  out.scofield = searchScofield(notesTerms, 16)
  out.henry = searchHenry(notesTerms, 12)
  out.tsk = searchTsk(notesTerms, 12)
  out.easton = searchEaston(notesTerms, 12)
  return out
}

export const STUDY_LABELS: Record<StudySource, string> = {
  scripture: 'Scripture',
  naves: 'Topics',
  scofield: 'Notes',
  henry: 'Commentary',
  tsk: 'See also',
  easton: 'Dictionary',
}

export const STUDY_ORDER: StudySource[] = ['scripture', 'naves', 'scofield', 'henry', 'tsk', 'easton']
