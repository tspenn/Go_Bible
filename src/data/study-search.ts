import { searchDictionary, type DictEntry } from './dictionary'
import { SEED_NOTES } from './henry'
import { bookName } from './kjv'
import { searchTopics } from './naves'
import { SCOFIELD } from './scofield'

export type StudySource = 'naves' | 'scofield' | 'henry' | 'tsk' | 'easton'

export type StudyHit = {
  source: StudySource
  title: string
  detail: string
  href: string
}

export type StudyResults = Record<StudySource, StudyHit[]>

type ScoRow = { t: string; b: string; c: number; v: number; s: string }
type HenryRow = { b: string; c: number; v: number; r: string; s: string; h: string }
type TskRow = { t: string; b: string; c: number; v: number }

const empty = (): StudyResults => ({
  naves: [],
  scofield: [],
  henry: [],
  tsk: [],
  easton: [],
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

function scoreTitle(title: string, q: string) {
  const t = title.toLowerCase()
  if (t === q) return 0
  if (t.startsWith(q)) return 1
  if (t.includes(q)) return 2
  return 3
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

function searchScofield(q: string, limit: number): StudyHit[] {
  const hits: StudyHit[] = []
  const seen = new Set<string>()
  for (const n of SCOFIELD) {
    const title = n.heading || n.kjvPhrase
    const hay = `${title} ${n.body}`.toLowerCase()
    if (!hay.includes(q)) continue
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
      return `${r.t} ${r.s}`.toLowerCase().includes(q)
    })
    .sort((a, b) => scoreTitle(a.t, q) - scoreTitle(b.t, q))
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

function searchHenry(q: string, limit: number): StudyHit[] {
  const hits: StudyHit[] = []
  const seen = new Set<string>()
  for (const n of SEED_NOTES) {
    if (!n.body.toLowerCase().includes(q)) continue
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
    .filter((r) => r.h.includes(q) || r.s.toLowerCase().includes(q))
    .sort((a, b) => Number(b.s.toLowerCase().includes(q)) - Number(a.s.toLowerCase().includes(q)))
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

function searchTsk(q: string, limit: number): StudyHit[] {
  const extra = (tskRows ?? [])
    .filter((r) => r.t.toLowerCase().includes(q))
    .sort((a, b) => scoreTitle(a.t, q) - scoreTitle(b.t, q) || a.t.length - b.t.length)
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
  await loadIndexes()
  out.naves = searchTopics(q)
    .slice(0, 20)
    .map((t) => ({
      source: 'naves',
      title: t.name,
      detail: t.summary,
      href: `/topics/${t.slug}`,
    }))
  out.scofield = searchScofield(n, 16)
  out.henry = searchHenry(n, 12)
  out.tsk = searchTsk(n, 12)
  out.easton = searchDictionary(q, 12).map(eastonHit)
  return out
}

export const STUDY_LABELS: Record<StudySource, string> = {
  naves: 'Topics',
  scofield: 'Notes',
  henry: 'Commentary',
  tsk: 'See also',
  easton: 'Dictionary',
}

export const STUDY_ORDER: StudySource[] = ['naves', 'scofield', 'henry', 'tsk', 'easton']
