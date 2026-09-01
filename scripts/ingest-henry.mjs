/**
 * Matthew Henry, Exposition of the Old and New Testament (complete).
 * Public domain. OT 1706–1710; NT finished from his papers after 1714 (through 1721).
 *
 * Source: OpenChristianData matthew-henry-complete (CC0 / PDM), HelloAO copy of the
 * complete commentary. commentary_text only — never BSB verse_text, never MHCC Concise.
 *
 * Adds notes beside src/data/henry.ts seed. Does not replace seed wording.
 * webPhrase only when that WEB (LORD) wording already sits in Henry’s comment.
 *
 *   node scripts/ingest-henry.mjs
 */
import { createWriteStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { get } from 'node:https'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const rawDir = join(root, 'scripts', 'raw', 'henry')
const outDir = join(root, 'src', 'data', 'henry-books')
const webPath = join(root, 'src', 'data', 'web.json')
const listPath = join(root, 'tmp-web', 'henry-list.json')
const BASE =
  'https://raw.githubusercontent.com/OpenChristianData/open-christian-data/main/data/commentaries/matthew-henry'

const SOURCE =
  'Matthew Henry, Exposition of the Old and New Testament (1706–1721). Public domain. Complete commentary; not the Concise (MHCC) abridgement.'

const SEED = [
  { bookSlug: 'genesis', chapter: 1, verse: 1, range: '1-2' },
  { bookSlug: 'john', chapter: 1, verse: 1, range: '1-5' },
  { bookSlug: 'john', chapter: 3, verse: 16, range: '1-21' },
  { bookSlug: 'john', chapter: 14, verse: 6, range: '4-11' },
  { bookSlug: 'romans', chapter: 8, verse: 28, range: '28-31' },
  { bookSlug: 'romans', chapter: 10, verse: 17, range: '14-21' },
  { bookSlug: '2-corinthians', chapter: 5, verse: 7, range: '1-11' },
  { bookSlug: 'hebrews', chapter: 11, verse: 1, range: '1-3' },
  { bookSlug: 'hebrews', chapter: 11, verse: 6, range: '4-7' },
  { bookSlug: 'proverbs', chapter: 3, verse: 5, range: '5-6' },
  { bookSlug: 'matthew', chapter: 11, verse: 28, range: '25-30' },
  { bookSlug: '1-peter', chapter: 5, verse: 7, range: '5-7' },
]

const SKIP = new Set([
  'the',
  'and',
  'of',
  'to',
  'in',
  'that',
  'for',
  'was',
  'were',
  'with',
  'from',
  'this',
  'they',
  'them',
  'his',
  'her',
  'you',
  'your',
  'our',
  'not',
  'but',
  'all',
  'are',
  'had',
  'has',
  'have',
  'him',
  'who',
  'which',
  'unto',
  'shall',
  'will',
  'god',
  'lord',
  'jesus',
  'christ',
])

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const out = createWriteStream(dest)
    get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        out.close()
        download(res.headers.location, dest).then(resolve, reject)
        return
      }
      if (res.statusCode !== 200) {
        out.close()
        reject(new Error(`${url} -> ${res.statusCode}`))
        return
      }
      res.pipe(out)
      out.on('finish', () => out.close(resolve))
    }).on('error', reject)
  })
}

function rangePair(range, fallbackVerse) {
  if (!range || range === 'intro') return null
  const m = String(range).match(/^(\d+)\s*[-–]\s*(\d+)$/)
  if (m) return [Number(m[1]), Number(m[2])]
  const n = Number(range)
  if (n) return [n, n]
  if (fallbackVerse) return [fallbackVerse, fallbackVerse]
  return null
}

function overlapsSeed(bookSlug, chapter, range) {
  const pair = rangePair(range)
  if (!pair) return false
  for (const s of SEED) {
    if (s.bookSlug !== bookSlug || s.chapter !== chapter) continue
    const sp = rangePair(s.range, s.verse)
    if (!sp) continue
    if (pair[0] <= sp[1] && sp[0] <= pair[1]) return true
  }
  return false
}

function phraseSpan(text, phrase) {
  const needle = phrase.trim()
  if (!needle) return null
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
  const m = text.match(new RegExp(escaped, 'i'))
  if (!m || m.index == null) return null
  return { start: m.index, end: m.index + m[0].length }
}

function attachWeb(webText, body) {
  if (!webText || !body) return ''
  const tokens = []
  const re = /\p{L}[\p{L}’']*/gu
  for (const m of webText.matchAll(re)) {
    if (m.index == null) continue
    tokens.push({ t: m[0], start: m.index, end: m.index + m[0].length })
  }
  for (let n = Math.min(4, tokens.length); n >= 2; n--) {
    for (let i = 0; i <= tokens.length - n; i++) {
      const slice = tokens.slice(i, i + n)
      if (slice.every((s) => SKIP.has(s.t.toLowerCase()))) continue
      if (!slice.some((s) => s.t.length >= 5 && !SKIP.has(s.t.toLowerCase()))) continue
      const phrase = webText.slice(slice[0].start, slice[n - 1].end)
      if (phrase.length < 7) continue
      const span = phraseSpan(body, phrase)
      if (span) return webText.slice(slice[0].start, slice[n - 1].end)
    }
  }
  return ''
}

function cleanBody(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

mkdirSync(rawDir, { recursive: true })
mkdirSync(outDir, { recursive: true })

const list = JSON.parse(readFileSync(listPath, 'utf8'))
const files = list.filter((f) => f.name.endsWith('.json') && f.name !== '_manifest.json')
const web = JSON.parse(readFileSync(webPath, 'utf8'))
const webMap = new Map()
for (const book of web.books) {
  book.chapters.forEach((verses, ci) => {
    verses.forEach((text, vi) => {
      webMap.set(`${book.slug}:${ci + 1}:${vi + 1}`, text)
    })
  })
}

for (const f of files) {
  const dest = join(rawDir, f.name)
  if (existsSync(dest) && statSync(dest).size > 1000) continue
  process.stdout.write(`download ${f.name}\n`)
  await download(`${BASE}/${f.name}`, dest)
}

let added = 0
let skipped = 0
const verses = new Set(SEED.map((s) => `${s.bookSlug}:${s.chapter}:${s.verse}`))
const books = []

for (const f of files) {
  const slug = f.name.replace(/\.json$/, '')
  const payload = JSON.parse(readFileSync(join(rawDir, f.name), 'utf8'))
  const notes = []
  for (const row of payload.data ?? []) {
    const body = cleanBody(row.commentary_text)
    if (body.length < 40) continue
    const isIntro = row.verse_range === 'intro' || Number(row.chapter) === 0
    const chapter = Number(row.chapter) > 0 ? Number(row.chapter) : 1
    if (!isIntro && overlapsSeed(slug, chapter, row.verse_range)) {
      skipped += 1
      continue
    }
    const pair = isIntro ? [1, 1] : rangePair(row.verse_range, 1)
    const verse = pair ? pair[0] : 1
    const range = isIntro ? 'intro' : pair && pair[0] !== pair[1] ? `${pair[0]}-${pair[1]}` : String(verse)
    const webText = webMap.get(`${slug}:${chapter}:${verse}`) ?? ''
    const note = {
      bookSlug: slug,
      chapter,
      verse,
      range,
      body,
      webPhrase: isIntro ? '' : attachWeb(webText, body),
    }
    notes.push(note)
    added += 1
    if (isIntro) verses.add(`${slug}:${chapter}:${verse}`)
    else {
      const [a, b] = pair ?? [verse, verse]
      for (let v = a; v <= b; v++) verses.add(`${slug}:${chapter}:${v}`)
    }
  }
  if (!notes.length) continue
  books.push(slug)
  writeFileSync(join(outDir, `${slug}.json`), `${JSON.stringify({ source: SOURCE, notes })}\n`)
}

const sosPath = join(outDir, 'song-of-solomon.json')
if (existsSync(sosPath)) {
  const sosNotes = JSON.parse(readFileSync(sosPath, 'utf8')).notes ?? []
  books.push('song-of-solomon')
  added += sosNotes.length
  for (const n of sosNotes) {
    if (n.range === 'intro') {
      verses.add(`${n.bookSlug}:${n.chapter}:${n.verse}`)
      continue
    }
    const pair = rangePair(n.range, n.verse)
    const [a, b] = pair ?? [n.verse, n.verse]
    for (let v = a; v <= b; v++) verses.add(`${n.bookSlug}:${n.chapter}:${v}`)
  }
}

writeFileSync(
  join(root, 'src', 'data', 'henry-index.json'),
  `${JSON.stringify({
    source: SOURCE,
    seedNotes: SEED.length,
    addedNotes: added,
    skippedSeedOverlaps: skipped,
    books: books.sort(),
    verses: verses.size,
    missing: existsSync(sosPath) ? [] : ['song-of-solomon'],
  })}\n`,
)

function sample(slug, ch, vs) {
  const path = join(outDir, `${slug}.json`)
  if (!existsSync(path)) return `${slug} ${ch}:${vs} (no book file)`
  const notes = JSON.parse(readFileSync(path, 'utf8')).notes.filter(
    (n) => n.chapter === ch && (n.verse === vs || rangePair(n.range, n.verse)?.[0] <= vs && rangePair(n.range, n.verse)?.[1] >= vs || n.range === 'intro' && vs === 1),
  )
  return `${slug} ${ch}:${vs} added=${notes.length} ranges=${notes.map((n) => n.range).join(',')}`
}

console.log(
  `Henry Exposition: kept ${SEED.length} seed notes, added ${added} groups, skipped ${skipped} overlaps, ${verses.size} verses covered, ${books.length} books`,
)
console.log(`  ${sample('genesis', 1, 1)}`)
console.log(`  ${sample('john', 3, 16)}`)
console.log(`  ${sample('philemon', 1, 1)}`)
