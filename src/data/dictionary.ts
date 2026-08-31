import easton from './easton.json' with { type: 'json' }
import { findVerse, isKnownBook, resolveBookSlug } from './kjv'

export type DictEntry = {
  slug: string
  name: string
  aliases: string[]
  body: string
  source: 'Easton' | 'Smith'
  sensitive?: string[]
  topic?: boolean
}

/** Public-domain dictionary (Easton 1897, Smith only when Easton has no headword). */
export const DICTIONARY: DictEntry[] = easton as DictEntry[]

export type DictSpan = {
  start: number
  end: number
  matched: string
  entry: DictEntry
}

const SENSITIVE_WORD = new Map<string, DictEntry>()
const ANY_WORD = new Map<string, DictEntry>()

function addLabel(text: string, entry: DictEntry, sensitive: boolean) {
  if (sensitive) SENSITIVE_WORD.set(text, entry)
  else {
    const key = text.toLowerCase()
    if (!ANY_WORD.has(key)) ANY_WORD.set(key, entry)
  }
}

for (const entry of DICTIONARY) {
  const sensitive = new Set(entry.sensitive ?? [])
  addLabel(entry.name, entry, sensitive.has(entry.name))
  for (const alias of entry.aliases) {
    addLabel(alias, entry, sensitive.has(alias))
  }
}

const TITLE_SKIP = new Set([
  'god',
  'jesus',
  'christ',
  'lord',
  'jehovah',
  'yahweh',
  'father',
  'son',
  'holy',
  'amen',
  'prince',
  'everlasting',
  'mighty',
  'wonderful',
])

function peelPossessive(token: string) {
  return token.replace(/['’]s?$/u, '')
}

function resolvePhrase(phrase: string) {
  const peeled = peelPossessive(phrase)
  const sensitive = SENSITIVE_WORD.get(peeled) ?? SENSITIVE_WORD.get(phrase)
  if (sensitive) return sensitive
  const entry = ANY_WORD.get(peeled.toLowerCase()) ?? ANY_WORD.get(phrase.toLowerCase())
  if (!entry) return undefined
  if (entry.topic || /\s/.test(phrase)) return entry
  if (TITLE_SKIP.has(peeled.toLowerCase())) return undefined
  if (!/^\p{Lu}/u.test(phrase)) return undefined
  return entry
}

export function findDict(slug: string) {
  return DICTIONARY.find((d) => d.slug === slug)
}

export function dictForWord(word: string, linked?: DictEntry[]) {
  const pool = linked && linked.length ? linked : DICTIONARY
  const peeled = peelPossessive(word)
  const sensitive = SENSITIVE_WORD.get(peeled)
  if (sensitive && pool.some((d) => d.slug === sensitive.slug)) return sensitive
  const any = ANY_WORD.get(peeled.toLowerCase())
  if (any && pool.some((d) => d.slug === any.slug)) {
    if (any.topic || peeled.includes(' ') || /^\p{Lu}/u.test(word) || word !== peeled) return any
  }
  for (const d of pool) {
    for (const label of [d.name, ...d.aliases]) {
      if (label.includes(' ')) continue
      if ((d.sensitive ?? []).includes(label)) {
        if (word === label) return d
        continue
      }
      if (label.toLowerCase() === peeled.toLowerCase()) return d
    }
  }
  return undefined
}

export function dictSpansInText(text: string): DictSpan[] {
  const tokens: { t: string; start: number; end: number }[] = []
  const re = /\p{L}[\p{L}’']*/gu
  for (const m of text.matchAll(re)) {
    if (m.index == null) continue
    tokens.push({ t: m[0], start: m.index, end: m.index + m[0].length })
  }
  const found: DictSpan[] = []
  const taken = new Array(tokens.length).fill(false)
  for (let i = 0; i < tokens.length; i++) {
    if (taken[i]) continue
    for (let n = Math.min(4, tokens.length - i); n >= 1; n--) {
      const slice = tokens.slice(i, i + n)
      const phrase = slice.map((s) => s.t).join(' ')
      const entry = resolvePhrase(phrase)
      if (!entry) continue
      const start = slice[0].start
      const end = slice[n - 1].end
      found.push({ start, end, matched: text.slice(start, end), entry })
      for (let k = 0; k < n; k++) taken[i + k] = true
      break
    }
  }
  return found
}

export function dictEntriesInText(text: string) {
  const seen = new Set<string>()
  const out: DictEntry[] = []
  for (const span of dictSpansInText(text)) {
    if (seen.has(span.entry.slug)) continue
    seen.add(span.entry.slug)
    out.push(span.entry)
  }
  return out
}

export function dictForVerse(bookSlug: string, chapter: number, verse: number) {
  const v = findVerse(bookSlug, chapter, verse)
  if (!v) return []
  return dictEntriesInText(v.text)
}

export type LinkedBit =
  | { type: 'text'; text: string }
  | { type: 'ref'; text: string; href: string }
  | { type: 'dict'; text: string; entry: DictEntry }

const BOOK_REF = /\b(?:(\d+)\s+)?([A-Za-z]+)\.?\s+(\d+):(\d+)(?:[-–](\d+))?/g
const V_REF = /\bv(?:s)?\.\s*(\d+)(?:\s*[-–]\s*(\d+))?/gi

export function bibleVerseHref(bookSlug: string, chapter: number, verse: number) {
  return `/bible/${bookSlug}/${chapter}/${verse}`
}

const NOTE_DICT_SKIP = new Set(['faith', 'grace', 'hope', 'prayer', 'rest', 'shepherd'])

export function linkBodyBits(body: string, fromBook: string, fromChapter: number): LinkedBit[] {
  type Hit = { start: number; end: number; bit: Exclude<LinkedBit, { type: 'text' }> }
  const hits: Hit[] = []
  const bookRe = new RegExp(BOOK_REF.source, 'g')
  const vRe = new RegExp(V_REF.source, 'gi')

  for (const m of body.matchAll(bookRe)) {
    const book = [m[1], m[2]].filter(Boolean).join(' ')
    if (!isKnownBook(book) || m.index == null) continue
    hits.push({
      start: m.index,
      end: m.index + m[0].length,
      bit: {
        type: 'ref',
        text: m[0],
        href: bibleVerseHref(resolveBookSlug(book), Number(m[3]), Number(m[4])),
      },
    })
  }

  for (const m of body.matchAll(vRe)) {
    if (m.index == null) continue
    hits.push({
      start: m.index,
      end: m.index + m[0].length,
      bit: {
        type: 'ref',
        text: m[0],
        href: bibleVerseHref(fromBook, fromChapter, Number(m[1])),
      },
    })
  }

  for (const span of dictSpansInText(body)) {
    if (NOTE_DICT_SKIP.has(span.entry.slug) || span.entry.topic) continue
    if (hits.some((h) => span.start < h.end && span.end > h.start)) continue
    hits.push({
      start: span.start,
      end: span.end,
      bit: { type: 'dict', text: span.matched, entry: span.entry },
    })
  }

  hits.sort((a, b) => a.start - b.start)
  const bits: LinkedBit[] = []
  let at = 0
  for (const hit of hits) {
    if (hit.start < at) continue
    if (hit.start > at) bits.push({ type: 'text', text: body.slice(at, hit.start) })
    bits.push(hit.bit)
    at = hit.end
  }
  if (at < body.length) bits.push({ type: 'text', text: body.slice(at) })
  return bits
}
