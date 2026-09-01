import { bookName, findVerse, isKnownBook, resolveBookSlug } from './kjv'

export type ScofieldKind = 'word' | 'verse' | 'chain'

export type ScofieldRef = {
  bookSlug: string
  chapter: number
  verse: number
}

export type ScofieldNote = {
  bookSlug: string
  chapter: number
  verse: number
  heading?: string
  body: string
  /** KJV wording Scofield marked in 1917. */
  kjvPhrase: string
  /** Exact words in the displayed Go-Bible (WEB-based) verse. Empty if verse-level. */
  webPhrase: string
  letter: string
  kind: ScofieldKind
  seeAlso: ScofieldRef[]
}

export function noteKey(n: ScofieldNote, indexInChapter: number) {
  return `${n.bookSlug}-${n.chapter}-${n.verse}-${indexInChapter}`
}

export function markerLetter(indexInChapter: number) {
  return String.fromCharCode(97 + (indexInChapter % 26))
}

export function scofieldHref(ref: ScofieldRef) {
  return `/bible/${ref.bookSlug}/${ref.chapter}/${ref.verse}?tab=scofield`
}

export function formatScofieldRef(ref: ScofieldRef) {
  return `${bookName(ref.bookSlug)} ${ref.chapter}:${ref.verse}`
}

export function phraseSpan(text: string, phrase: string) {
  const needle = phrase.trim()
  if (!needle) return null
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
  const m = text.match(new RegExp(escaped, 'i'))
  if (!m || m.index == null) return null
  return { start: m.index, end: m.index + m[0].length }
}

export function findPhraseInVerse(text: string, phrase: string) {
  return phraseSpan(text, phrase)?.start ?? -1
}

export type ScofieldBodyBit =
  | { type: 'text'; text: string }
  | { type: 'ref'; text: string; href: string }

const BOOK_REF =
  /\b(?:(\d+)\s+)?([A-Za-z]+)\.?\s+(\d+):(\d+)(?:[-–](\d+))?/g
const VS_REF = /\bvs\.\s*(\d+)(?:[-–](\d+))?/gi
const SEE_SCOFIELD = /\bSee Scofield[,:]?\s*"([^"]+)"/gi

export function scofieldBodyBits(
  body: string,
  fromBook: string,
  fromChapter: number,
): ScofieldBodyBit[] {
  type Hit = { start: number; end: number; href: string }
  const hits: Hit[] = []
  const bookRe = new RegExp(BOOK_REF.source, 'g')
  const vsRe = new RegExp(VS_REF.source, 'gi')
  const seeRe = new RegExp(SEE_SCOFIELD.source, 'gi')

  function addRef(start: number, end: number, book: string, chapter: number, verse: number) {
    if (!isKnownBook(book)) return
    hits.push({
      start,
      end,
      href: scofieldHref({
        bookSlug: resolveBookSlug(book),
        chapter,
        verse,
      }),
    })
  }

  for (const m of body.matchAll(bookRe)) {
    const book = [m[1], m[2]].filter(Boolean).join(' ')
    if (m.index == null) continue
    addRef(m.index, m.index + m[0].length, book, Number(m[3]), Number(m[4]))
  }

  for (const m of body.matchAll(seeRe)) {
    if (m.index == null) continue
    const inner = m[1].trim().match(/^(?:(\d+)\s+)?([A-Za-z.]+)\s+(\d+):(\d+)/)
    if (!inner) continue
    const book = [inner[1], inner[2]].filter(Boolean).join(' ')
    addRef(m.index, m.index + m[0].length, book, Number(inner[3]), Number(inner[4]))
  }

  for (const m of body.matchAll(vsRe)) {
    if (m.index == null) continue
    const ref = { bookSlug: fromBook, chapter: fromChapter, verse: Number(m[1]) }
    hits.push({ start: m.index, end: m.index + m[0].length, href: scofieldHref(ref) })
  }

  hits.sort((a, b) => a.start - b.start || b.end - a.end)
  const bits: ScofieldBodyBit[] = []
  let at = 0
  for (const hit of hits) {
    if (hit.start < at) continue
    if (hit.start > at) bits.push({ type: 'text', text: body.slice(at, hit.start) })
    bits.push({ type: 'ref', text: body.slice(hit.start, hit.end), href: hit.href })
    at = hit.end
  }
  if (at < body.length) bits.push({ type: 'text', text: body.slice(at) })
  return bits
}

let audited = false

/** Log seed phrases that are not in the displayed verse. Do not invent a substitute. */
export function auditScofieldPhrases() {
  if (audited || typeof console === 'undefined') return
  audited = true
  for (const n of SCOFIELD) {
    if (!n.webPhrase) continue
    const v = findVerse(n.bookSlug, n.chapter, n.verse)
    if (!v || findPhraseInVerse(v.text, n.webPhrase) < 0) {
      console.warn(
        `Scofield miss: ${n.bookSlug} ${n.chapter}:${n.verse} kjvPhrase=${JSON.stringify(n.kjvPhrase)} webPhrase=${JSON.stringify(n.webPhrase)}`,
      )
    }
  }
}

/**
 * Seed notes from the 1917 Scofield Reference Bible (public domain).
 * Short extracts only. Expand later from the 1917 text — never the 1967 New Scofield.
 */
export const SCOFIELD: ScofieldNote[] = [
  {
    bookSlug: 'genesis',
    chapter: 1,
    verse: 1,
    heading: 'God',
    kjvPhrase: 'God',
    webPhrase: 'God',
    letter: 'a',
    kind: 'word',
    seeAlso: [
      { bookSlug: 'genesis', chapter: 1, verse: 26 },
      { bookSlug: 'genesis', chapter: 1, verse: 27 },
      { bookSlug: 'genesis', chapter: 3, verse: 22 },
    ],
    body: 'Elohim (sometimes El or Elah), English form "God," the first of the names of Deity, is a plural noun in form, but is used with a singular meaning, and with a singular verb. The plural form represents the Trinity. (See Gen. 1:26; Gen. 1:27; Gen. 3:22.)',
  },
  {
    bookSlug: 'john',
    chapter: 1,
    verse: 1,
    heading: 'the Word',
    kjvPhrase: 'the Word',
    webPhrase: 'the Word',
    letter: 'a',
    kind: 'word',
    seeAlso: [
      { bookSlug: '1-corinthians', chapter: 1, verse: 24 },
      { bookSlug: 'john', chapter: 1, verse: 14 },
      { bookSlug: 'john', chapter: 14, verse: 9 },
      { bookSlug: 'colossians', chapter: 2, verse: 9 },
    ],
    body: 'Gr. Logos (log\'-os) = "a thought or concept, and the expression or utterance of that thought." As a designation of Christ it occurs in the writings of John. (See 1 Cor. 1:24; John 1:14; John 14:9; Col. 2:9.)',
  },
  {
    bookSlug: 'john',
    chapter: 3,
    verse: 16,
    heading: 'world',
    kjvPhrase: 'world',
    webPhrase: 'world',
    letter: 'a',
    kind: 'word',
    seeAlso: [{ bookSlug: 'matthew', chapter: 4, verse: 8 }],
    body: 'Gr. kosmos = mankind. (See Scofield, Matt. 4:8.)',
  },
  {
    bookSlug: 'john',
    chapter: 3,
    verse: 16,
    heading: 'everlasting life',
    kjvPhrase: 'everlasting life',
    webPhrase: 'eternal life',
    letter: 'b',
    kind: 'chain',
    seeAlso: [],
    body: '"Everlasting life" is a life, not a mere endless existence. It is the life of God revealed in Christ, imparted to the believer.',
  },
  {
    bookSlug: 'matthew',
    chapter: 4,
    verse: 8,
    heading: 'world',
    kjvPhrase: 'world',
    webPhrase: 'world',
    letter: 'a',
    kind: 'word',
    seeAlso: [
      { bookSlug: 'revelation', chapter: 13, verse: 8 },
      { bookSlug: 'john', chapter: 7, verse: 7 },
    ],
    body: 'The Greek word kosmos means "order," "arrangement," and so, with the Greeks, "beauty"; for order and arrangement in the sense of system are at the bottom of the Greek conception of beauty. When used in the N.T. of humanity, the "world" of men, it is organized humanity--humanity in families, tribes, nations--which is meant. The word for chaotic, unorganized humanity--the mere mass of man is thalassa, the "sea" of men (e.g. Revelation 13:1). (See Scofield "Revelation 13:8".) For "world" (kosmos) in the bad ethical sense, "world system," John 7:7.',
  },
  {
    bookSlug: 'john',
    chapter: 14,
    verse: 6,
    heading: 'the way',
    kjvPhrase: 'the way',
    webPhrase: 'the way',
    letter: 'a',
    kind: 'word',
    seeAlso: [],
    body: 'Christ is not one way among many. He is the way to the Father.',
  },
  {
    bookSlug: 'romans',
    chapter: 8,
    verse: 28,
    heading: 'all things',
    kjvPhrase: 'all things',
    webPhrase: 'all things',
    letter: 'a',
    kind: 'word',
    seeAlso: [{ bookSlug: 'romans', chapter: 8, verse: 17 }],
    body: 'The "all things" of this verse include the sufferings of vs. 17-27. They work together for good to them that love God.',
  },
  {
    bookSlug: 'romans',
    chapter: 10,
    verse: 17,
    heading: 'faith',
    kjvPhrase: 'faith',
    webPhrase: 'faith',
    letter: 'a',
    kind: 'word',
    seeAlso: [{ bookSlug: 'hebrews', chapter: 11, verse: 1 }],
    body: 'Faith is not a mere belief in historical facts. It comes by hearing the word of God, and lays hold of Christ. (See Heb. 11:1.)',
  },
  {
    bookSlug: '2-corinthians',
    chapter: 5,
    verse: 7,
    heading: 'walk by faith',
    kjvPhrase: 'walk by faith',
    webPhrase: 'walk by faith',
    letter: 'a',
    kind: 'word',
    seeAlso: [{ bookSlug: 'hebrews', chapter: 11, verse: 1 }],
    body: 'The Christian walk is not directed by the seen and temporal, but by the unseen and eternal. (Cf. Heb. 11:1.)',
  },
  {
    bookSlug: 'hebrews',
    chapter: 11,
    verse: 1,
    heading: 'faith',
    kjvPhrase: 'faith',
    webPhrase: 'faith',
    letter: 'a',
    kind: 'word',
    seeAlso: [{ bookSlug: 'hebrews', chapter: 11, verse: 6 }],
    body: 'Faith is taking God at His word. It is the substance (or assurance) of things hoped for, the evidence of things not seen. (See Heb. 11:6.)',
  },
  {
    bookSlug: 'hebrews',
    chapter: 11,
    verse: 6,
    heading: 'without faith',
    kjvPhrase: 'without faith',
    webPhrase: 'Without faith',
    letter: 'a',
    kind: 'word',
    seeAlso: [{ bookSlug: 'hebrews', chapter: 11, verse: 1 }],
    body: 'The two necessities: that God is, and that He rewards those who seek Him. Faith must rest on both. (See Heb. 11:1.)',
  },
  {
    bookSlug: 'proverbs',
    chapter: 3,
    verse: 5,
    heading: 'trust',
    kjvPhrase: 'Trust',
    webPhrase: 'Trust',
    letter: 'a',
    kind: 'word',
    seeAlso: [],
    body: 'Trust is the Old Testament word nearest to the New Testament "faith." It excludes self-confidence.',
  },
  {
    bookSlug: 'matthew',
    chapter: 11,
    verse: 28,
    heading: 'Come',
    kjvPhrase: 'Come',
    webPhrase: 'Come',
    letter: 'a',
    kind: 'word',
    seeAlso: [],
    body: 'The new message of Jesus. The rejected King now turns from the rejecting nation and offers, not the kingdom, but rest and service to such in the nation as are conscious of the need. It is a pivotal point in the ministry of Jesus.',
  },
  {
    bookSlug: '1-peter',
    chapter: 5,
    verse: 7,
    heading: 'care',
    kjvPhrase: 'care',
    webPhrase: 'worries',
    letter: 'a',
    kind: 'word',
    seeAlso: [],
    body: 'Anxiety is forbidden because it both distrusts and dishonours God, who cares.',
  },
]

export function notesForVerse(bookSlug: string, chapter: number, verse: number) {
  return SCOFIELD.filter(
    (n) => n.bookSlug === bookSlug && n.chapter === chapter && n.verse === verse,
  )
}

export function notesForChapter(bookSlug: string, chapter: number) {
  return SCOFIELD.filter((n) => n.bookSlug === bookSlug && n.chapter === chapter)
}
