/**
 * A. T. Robertson, Word Pictures in the New Testament, vols. 1–3 (1930).
 * Public domain. Matthew, Mark, Luke, Acts only.
 *
 * Source: CCEL ThML (print basis 1930). Do not ingest vols. 4–6 (John,
 * Pauline epistles, Hebrews, General Epistles, Revelation; 1931–1933).
 * Do not use later reprints’ extra notes or the 100th-anniversary reset.
 *
 * Adds notes beside the seed in src/data/robertson.ts. Does not replace
 * seed wording. `word` is filled only when that English already sits in
 * the displayed Go-Bible (WEB, LORD) verse.
 *
 *   node scripts/ingest-robertson.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const rawDir = join(root, 'scripts', 'raw', 'robertson')
const outDir = join(root, 'src', 'data', 'robertson-books')
const webPath = join(root, 'src', 'data', 'web.json')
const seedPath = join(root, 'src', 'data', 'robertson.ts')

const SOURCE =
  'A. T. Robertson, Word Pictures, vols. 1–3 (1930). Public domain. CCEL text of the 1930 volumes. Not vols. 4–6 (1931–1933).'

const BOOKS = [
  {
    slug: 'matthew',
    file: 'wp_matt.xml',
    url: 'https://ccel.org/ccel/robertson_at/wp_matt.xml',
    chapters: 28,
  },
  {
    slug: 'mark',
    file: 'wp_mark.xml',
    url: 'https://ccel.org/ccel/robertson_at/wp_mark.xml',
    chapters: 16,
  },
  {
    slug: 'luke',
    file: 'wp_luke.xml',
    url: 'https://ccel.org/ccel/robertson_at/wp_luke.xml',
    chapters: 24,
  },
  {
    slug: 'acts',
    file: 'wp_acts.xml',
    url: 'https://ccel.org/ccel/robertson_at/wp_acts.xml',
    chapters: 28,
  },
]

const STOP = new Set(
  `a an and as at be but by for from had has have he her him his i in is it its of on or she so that the their them they this to unto upon was were with you your into onto down out up off over under then than who whom which when where what how all any not nor if my me we us our ye thy thee thou shalt did do does done been being will would could should may might shall let put get go came come went also even only such other both each few more most some these those very can just`.split(
    ' ',
  ),
)

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(Number.parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
}

function collapse(s) {
  return s.replace(/\s+/g, ' ').trim()
}

function stripXml(html) {
  let s = html
    .replace(/<scripRef\b[^>]*>/gi, '')
    .replace(/<\/scripRef>/gi, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(?:i|em|cite|span|a|sup|sub)\b[^>]*>/gi, '')
    .replace(/<\/?b>/gi, '')
    .replace(/<[^>]+>/g, ' ')
  return collapse(decodeEntities(s))
}

function headingFromBold(chunk) {
  const m = chunk.match(/<b>([\s\S]*?)<\/b>/i)
  if (!m) return ''
  return collapse(stripXml(m[1])).replace(/[.:;?!]+$/, '').trim()
}

function headingFromPlain(text) {
  const cut = text.match(/^(?:(\d+):(\d+)\s+)?(.+?)\s*\[/)
  if (cut) return collapse(cut[3]).replace(/[.:;?!]+$/, '').trim()
  const first = text.split(/(?<=\.)\s/)[0] || text
  return collapse(first).slice(0, 80).replace(/[.:;?!]+$/, '').trim()
}

function phraseSpan(text, phrase) {
  const needle = phrase.trim()
  if (!needle) return null
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
  const m = text.match(new RegExp(`\\b${escaped}\\b`, 'i'))
  if (!m || m.index == null) return null
  return { start: m.index, end: m.index + m[0].length, text: m[0] }
}

function fold(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function overlaps(a, b) {
  const x = fold(a)
  const y = fold(b)
  if (!x || !y) return false
  if (x.includes(y) || y.includes(x)) return Math.min(x.length, y.length) >= 40
  const win = 48
  if (x.length < win || y.length < win) return false
  for (let i = 0; i <= x.length - win; i += 10) {
    if (y.includes(x.slice(i, i + win))) return true
  }
  return false
}

function collides(note, seedOnVerse) {
  for (const s of seedOnVerse) {
    if (note.heading && fold(note.heading) === fold(s.heading)) return true
    if (overlaps(note.body, s.body)) return true
  }
  return false
}

function attachWord(webText, heading, used) {
  if (!webText || !heading) return ''
  const tokens = heading.match(/\p{L}[\p{L}’']*/gu) ?? []
  for (let n = Math.min(4, tokens.length); n >= 1; n--) {
    for (let i = 0; i <= tokens.length - n; i++) {
      const slice = tokens.slice(i, i + n)
      if (slice.every((t) => STOP.has(t.toLowerCase()))) continue
      if (n === 1 && slice[0].length < 4) continue
      const phrase = slice.join(' ')
      const span = phraseSpan(webText, phrase)
      if (!span) continue
      const ranked = [...slice].sort((a, b) => {
        const as = STOP.has(a.toLowerCase()) ? 0 : a.length
        const bs = STOP.has(b.toLowerCase()) ? 0 : b.length
        return bs - as
      })
      for (const t of ranked) {
        const key = t.toLowerCase()
        if (STOP.has(key) && n > 1) continue
        if (used.has(key)) continue
        const hit = phraseSpan(webText, t)
        if (!hit) continue
        used.add(key)
        return hit.text
      }
    }
  }
  return ''
}

function takeVerse(plain, chapter, verseMax, current) {
  const vm = plain.match(/^(\d+):(\d+)\b/)
  if (!vm) return current
  const ch = Number(vm[1])
  const vs = Number(vm[2])
  if (ch === chapter && vs >= 1 && vs <= verseMax) return vs
  return current
}

function parseChapter(xml, slug, chapter, verseMax) {
  const notes = []
  let verse = 0
  const paras = xml.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) ?? []
  for (const p of paras) {
    const inner = p.replace(/^<p\b[^>]*>/i, '').replace(/<\/p>$/i, '')
    const chunks = inner.split(/(?=<b>)/i)
    for (const chunk of chunks) {
      const plain = stripXml(chunk)
      if (!plain) continue
      verse = takeVerse(plain, chapter, verseMax, verse)
      if (verse < 1 || verse > verseMax) continue
      let heading = headingFromBold(chunk)
      if (!heading) heading = headingFromPlain(plain.replace(/^\d+:\d+\s*/, ''))
      if (heading.length > 120) heading = heading.slice(0, 117).replace(/\s+\S*$/, '')
      const body = plain.replace(/^\d+:\d+\s*/, '')
      if (body.length < 24) continue
      notes.push({
        bookSlug: slug,
        chapter,
        verse,
        heading: heading || undefined,
        body,
      })
    }
  }
  return notes
}

function displayVerse(slug, chapter, verse) {
  const text = webMap.get(`${slug}:${chapter}:${verse}`)
  if (text) return verse
  for (let prev = verse - 1; prev >= 1; prev -= 1) {
    if (webMap.get(`${slug}:${chapter}:${prev}`)) return prev
  }
  return 0
}
function parseBook(xml, slug, chapterCount, verseCounts) {
  const notes = []
  const seenCh = new Set()
  const parts = xml.split(/<div1\b/i)
  for (const part of parts) {
    const title = part.match(/title="([^"]+)"/)?.[1] ?? ''
    const chm = title.match(/^Chapter (\d+)$/)
    if (!chm) continue
    const chapter = Number(chm[1])
    if (chapter < 1 || chapter > chapterCount) continue
    seenCh.add(chapter)
    const body = part.replace(/<div1\b[^>]*>/i, '').replace(/<\/div1>[\s\S]*$/i, '')
    notes.push(...parseChapter(body, slug, chapter, verseCounts[chapter] ?? 0))
  }
  return { notes, chapters: seenCh }
}

function loadSeed() {
  const src = readFileSync(seedPath, 'utf8')
  const block = src.slice(src.indexOf('export const ROBERTSON'), src.indexOf('export function notesForVerse'))
  const notes = []
  const re =
    /bookSlug: '([^']+)',\s*chapter: (\d+),\s*verse: (\d+),\s*heading: '((?:\\'|[^'])*)',\s*word: '((?:\\'|[^'])*)',\s*body: '((?:\\'|[^'])*)'/g
  for (const m of block.matchAll(re)) {
    notes.push({
      bookSlug: m[1],
      chapter: Number(m[2]),
      verse: Number(m[3]),
      heading: m[4].replace(/\\'/g, "'"),
      word: m[5],
      body: m[6].replace(/\\'/g, "'"),
    })
  }
  return notes
}

async function ensureXml(book) {
  mkdirSync(rawDir, { recursive: true })
  const dest = join(rawDir, book.file)
  if (existsSync(dest) && readFileSync(dest).length > 50_000) return dest
  const res = await fetch(book.url)
  if (!res.ok) throw new Error(`${book.url} -> ${res.status}`)
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
  return dest
}

const web = JSON.parse(readFileSync(webPath, 'utf8'))
const webMap = new Map()
const verseCounts = new Map()
for (const book of web.books) {
  const counts = [0]
  book.chapters.forEach((verses, ci) => {
    counts[ci + 1] = verses.length
    verses.forEach((text, vi) => {
      webMap.set(`${book.slug}:${ci + 1}:${vi + 1}`, text)
    })
  })
  verseCounts.set(book.slug, counts)
}

const seed = loadSeed()
if (seed.length < 10) {
  throw new Error(`Failed to read seed notes from robertson.ts (got ${seed.length})`)
}
const seedByVerse = new Map()
for (const n of seed) {
  const k = `${n.bookSlug}:${n.chapter}:${n.verse}`
  const list = seedByVerse.get(k) ?? []
  list.push(n)
  seedByVerse.set(k, list)
}

const added = []
let skipped = 0
const missingChapters = []

for (const book of BOOKS) {
  const path = await ensureXml(book)
  const xml = readFileSync(path, 'utf8')
  const counts = verseCounts.get(book.slug) ?? []
  const parsed = parseBook(xml, book.slug, book.chapters, counts)
  for (let c = 1; c <= book.chapters; c++) {
    if (!parsed.chapters.has(c)) missingChapters.push(`${book.slug} ${c}`)
  }
  const usedByVerse = new Map()
  for (const n of parsed.notes) {
    const verse = displayVerse(n.bookSlug, n.chapter, n.verse)
    if (!verse) continue
    const vk = `${n.bookSlug}:${n.chapter}:${verse}`
    const remapped = verse !== n.verse
    const note = { ...n, verse }
    const seedOnVerse = seedByVerse.get(vk) ?? []
    if (collides(note, seedOnVerse)) {
      skipped += 1
      continue
    }
    const used = usedByVerse.get(vk) ?? new Set(seedOnVerse.map((s) => s.word?.toLowerCase()).filter(Boolean))
    const webText = remapped ? '' : (webMap.get(vk) ?? '')
    const word = attachWord(webText, note.heading ?? '', used)
    usedByVerse.set(vk, used)
    added.push(word ? { ...note, word } : note)
  }
}

if (missingChapters.length) {
  throw new Error(`Missing Robertson chapters: ${missingChapters.join(', ')}`)
}

mkdirSync(outDir, { recursive: true })
const byBook = new Map()
for (const n of added) {
  const list = byBook.get(n.bookSlug) ?? []
  list.push(n)
  byBook.set(n.bookSlug, list)
}
for (const book of BOOKS) {
  const list = byBook.get(book.slug) ?? []
  writeFileSync(join(outDir, `${book.slug}.json`), `${JSON.stringify({ source: SOURCE, notes: list })}\n`)
}

const verses = new Set([
  ...seed.map((n) => `${n.bookSlug}:${n.chapter}:${n.verse}`),
  ...added.map((n) => `${n.bookSlug}:${n.chapter}:${n.verse}`),
])
writeFileSync(
  join(root, 'src', 'data', 'robertson-index.json'),
  `${JSON.stringify({
    source: SOURCE,
    seedNotes: seed.length,
    addedNotes: added.length,
    skippedSeedOverlaps: skipped,
    books: BOOKS.map((b) => b.slug),
    verses: verses.size,
  })}\n`,
)

function sample(slug, ch, vs) {
  const seedN = seed.filter((n) => n.bookSlug === slug && n.chapter === ch && n.verse === vs)
  const addN = added.filter((n) => n.bookSlug === slug && n.chapter === ch && n.verse === vs)
  const heads = [...seedN, ...addN].map((n) => n.heading || 'verse')
  const words = addN.filter((n) => n.word).map((n) => n.word)
  return `${slug} ${ch}:${vs} seed=${seedN.length} added=${addN.length} words=[${words.join(', ')}] headings=${heads.slice(0, 8).join(' | ')}`
}

console.log(
  `Robertson 1930 vols 1–3: kept ${seed.length} seed notes, added ${added.length} notes, skipped ${skipped} overlaps, ${verses.size} verses, ${byBook.size} books`,
)
console.log(`  ${sample('matthew', 5, 13)}`)
console.log(`  ${sample('matthew', 18, 1)}`)
console.log(`  ${sample('mark', 1, 1)}`)
console.log(`  ${sample('luke', 5, 1)}`)
console.log(`  ${sample('luke', 15, 11)}`)
console.log(`  ${sample('acts', 2, 1)}`)
for (const book of BOOKS) {
  const list = byBook.get(book.slug) ?? []
  const chans = new Set(list.map((n) => n.chapter))
  console.log(`  ${book.slug}: ${list.length} notes, ${chans.size}/${book.chapters} chapters`)
}
