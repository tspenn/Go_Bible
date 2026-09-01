import web from './web.json' with { type: 'json' }

export type Verse = {
  book: string
  bookSlug: string
  chapter: number
  verse: number
  text: string
}

type WebBook = { name: string; slug: string; chapters: string[][] }
type WebPayload = { source: string; books: WebBook[] }

const data = web as WebPayload
const bySlug = new Map(data.books.map((b) => [b.slug, b]))

/** Display name for the reading text. Do not call the altered wording WEB. */
export const TRANSLATION = 'Go-Bible text'
export const TRANSLATION_ABBR = 'Go-Bible'
export const SOURCE_LINE =
  'Go-Bible text, based on the World English Bible (public domain). Divine name rendered LORD.'

export const bibleBooks = data.books.map((b) => ({
  name: b.name,
  slug: b.slug,
  chapterCount: b.chapters.length,
}))

export const BOOKS = bibleBooks.map((b) => b.name)

export function slugBook(book: string) {
  return book.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const BOOK_ALIASES: Record<string, string> = {
  psalm: 'psalms',
  psa: 'psalms',
  ps: 'psalms',
  'song of songs': 'song-of-solomon',
  'song of solomon': 'song-of-solomon',
  canticles: 'song-of-solomon',
  gen: 'genesis',
  ex: 'exodus',
  exo: 'exodus',
  lev: 'leviticus',
  num: 'numbers',
  deut: 'deuteronomy',
  dt: 'deuteronomy',
  matt: 'matthew',
  mat: 'matthew',
  mt: 'matthew',
  mk: 'mark',
  mrk: 'mark',
  lk: 'luke',
  luk: 'luke',
  jn: 'john',
  jhn: 'john',
  joh: 'john',
  ro: 'romans',
  rom: 'romans',
  '1 cor': '1-corinthians',
  '2 cor': '2-corinthians',
  gal: 'galatians',
  eph: 'ephesians',
  phil: 'philippians',
  col: 'colossians',
  heb: 'hebrews',
  jas: 'james',
  jam: 'james',
  '1 jn': '1-john',
  '2 jn': '2-john',
  '3 jn': '3-john',
  '1 pet': '1-peter',
  '2 pet': '2-peter',
  '1 sam': '1-samuel',
  '2 sam': '2-samuel',
  '1 kgs': '1-kings',
  '2 kgs': '2-kings',
  '1 chr': '1-chronicles',
  '2 chr': '2-chronicles',
  isa: 'isaiah',
  jer: 'jeremiah',
  ezek: 'ezekiel',
  dan: 'daniel',
  rev: 'revelation',
  prov: 'proverbs',
  pr: 'proverbs',
}

for (const b of data.books) {
  BOOK_ALIASES[b.name.toLowerCase()] = b.slug
  BOOK_ALIASES[b.slug] = b.slug
}

export function resolveBookSlug(book: string) {
  const key = book.trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ')
  return BOOK_ALIASES[key] ?? (bySlug.has(slugBook(key)) ? slugBook(key) : slugBook(book))
}

export function isKnownBook(book: string) {
  const slug = resolveBookSlug(book)
  return bySlug.has(slug)
}

export function bookName(slug: string) {
  return bySlug.get(slug)?.name ?? slug
}

export function chapterCount(bookSlug: string) {
  return bySlug.get(bookSlug)?.chapters.length ?? 0
}

export function findVerse(bookSlug: string, chapter: number, verse: number) {
  const book = bySlug.get(bookSlug)
  const text = book?.chapters[chapter - 1]?.[verse - 1]
  if (!book || !text) return undefined
  return {
    book: book.name,
    bookSlug: book.slug,
    chapter,
    verse,
    text,
  }
}

export function versesInChapter(bookSlug: string, chapter: number) {
  const book = bySlug.get(bookSlug)
  const ch = book?.chapters[chapter - 1]
  if (!book || !ch) return []
  const out: Verse[] = []
  for (let i = 0; i < ch.length; i++) {
    const text = ch[i]
    if (!text) continue
    out.push({
      book: book.name,
      bookSlug: book.slug,
      chapter,
      verse: i + 1,
      text,
    })
  }
  return out
}

export function parseRef(input: string) {
  const cleaned = input.trim().replace(/\./g, ' ').replace(/:/g, ' ').replace(/\s+/g, ' ')
  const match = cleaned.match(/^(.+?)\s+(\d+)\s+(\d+)$/)
  if (!match) return null
  return {
    bookSlug: resolveBookSlug(match[1]),
    chapter: Number(match[2]),
    verse: Number(match[3]),
  }
}
