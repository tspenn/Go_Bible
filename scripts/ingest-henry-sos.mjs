/**
 * Matthew Henry, Exposition — Song of Solomon only.
 * Public domain complete commentary (not MHCC Concise).
 *
 * OpenChristianData / HelloAO omitted this book. Source here is the CC0
 * markdown of the complete Exposition (lyteword/mhenry-complete, Volume III).
 * YAML front matter and KJV verse quotes are not stored — commentary only.
 *
 * Adds src/data/henry-books/song-of-solomon.json. Does not rewrite other
 * henry-books files or seed notes in src/data/henry.ts.
 *
 *   node scripts/ingest-henry-sos.mjs
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const rawDir = join(root, 'scripts', 'raw', 'henry-sos')
const outDir = join(root, 'src', 'data', 'henry-books')
const webPath = join(root, 'src', 'data', 'web.json')
const indexPath = join(root, 'src', 'data', 'henry-index.json')

const SLUG = 'song-of-solomon'
const SOURCE =
  'Matthew Henry, Exposition of the Old and New Testament (1706–1721). Public domain. Complete commentary; not the Concise (MHCC) abridgement.'

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

const SUPER = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
}

function verseNum(raw) {
  const digits = [...String(raw)].map((c) => SUPER[c] ?? c).join('')
  return Number(digits)
}

function stripYaml(text) {
  return String(text || '').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
}

function cleanBody(text) {
  return String(text || '')
    .replace(/\{\{<[\s\S]*?>\}\}/g, '')
    .replace(/^#+\s.*$/gm, '')
    .replace(/\\\./g, '.')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
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

function splitSections(md) {
  const parts = md.split(/^## /m)
  const lead = parts.shift() ?? ''
  const title = lead.replace(/^#\s.*$/m, '').trim()
  const sections = parts.map((chunk) => {
    const nl = chunk.indexOf('\n')
    const heading = (nl === -1 ? chunk : chunk.slice(0, nl)).trim()
    const rest = nl === -1 ? '' : chunk.slice(nl + 1)
    return { heading, rest }
  })
  return { title, sections }
}

function pullVerses(block) {
  const verses = []
  const lines = []
  let inQuotes = true
  for (const line of String(block).replace(/\r/g, '').split('\n')) {
    const vm = line.match(/^>\s*\*\*([¹²³⁴⁵⁶⁷⁸⁹⁰0-9]+)\*\*/)
    if (vm && inQuotes) {
      verses.push(verseNum(vm[1]))
      continue
    }
    if (inQuotes && (line.startsWith('>') || line.trim() === '')) continue
    inQuotes = false
    lines.push(line)
  }
  return { verses, body: lines.join('\n') }
}

const web = JSON.parse(readFileSync(webPath, 'utf8'))
const webMap = new Map()
for (const book of web.books) {
  book.chapters.forEach((verses, ci) => {
    verses.forEach((text, vi) => {
      webMap.set(`${book.slug}:${ci + 1}:${vi + 1}`, text)
    })
  })
}

const files = readdirSync(rawDir).filter((f) => f.endsWith('.md'))
if (!files.includes('_index.md') || !files.some((f) => f.startsWith('chapter-'))) {
  throw new Error(`Missing Song of Solomon markdown in ${rawDir}`)
}

const notes = []
const verses = new Set()

function addNote({ chapter, verse, range, body }) {
  const text = cleanBody(body)
  if (text.length < 40) return
  const webText = webMap.get(`${SLUG}:${chapter}:${verse}`) ?? ''
  notes.push({
    bookSlug: SLUG,
    chapter,
    verse,
    range,
    body: text,
    webPhrase: range === 'intro' ? '' : attachWeb(webText, text),
  })
  if (range === 'intro') verses.add(`${SLUG}:${chapter}:${verse}`)
  else {
    const m = String(range).match(/^(\d+)\s*[-–]\s*(\d+)$/)
    const a = m ? Number(m[1]) : verse
    const b = m ? Number(m[2]) : verse
    for (let v = a; v <= b; v++) verses.add(`${SLUG}:${chapter}:${v}`)
  }
}

const indexMd = stripYaml(readFileSync(join(rawDir, '_index.md'), 'utf8'))
const introMatch = indexMd.split(/^## Introduction\s*$/m)[1] ?? ''
addNote({
  chapter: 1,
  verse: 1,
  range: 'intro',
  body: introMatch,
})

for (const file of files.filter((f) => /^chapter-\d+\.md$/.test(f)).sort((a, b) => {
  return Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0])
})) {
  const chapter = Number(file.match(/\d+/)[0])
  const { title, sections } = splitSections(stripYaml(readFileSync(join(rawDir, file), 'utf8')))
  addNote({
    chapter,
    verse: 1,
    range: 'intro',
    body: title,
  })
  for (const section of sections) {
    const { verses: nums, body } = pullVerses(section.rest)
    if (!nums.length) continue
    const a = Math.min(...nums)
    const b = Math.max(...nums)
    const range = a === b ? String(a) : `${a}-${b}`
    addNote({
      chapter,
      verse: a,
      range,
      body,
    })
  }
}

function coverCount(list) {
  const set = new Set()
  for (const n of list) {
    if (n.range === 'intro') {
      set.add(`${n.bookSlug}:${n.chapter}:${n.verse}`)
      continue
    }
    const m = String(n.range).match(/^(\d+)\s*[-–]\s*(\d+)$/)
    const a = m ? Number(m[1]) : n.verse
    const b = m ? Number(m[2]) : n.verse
    for (let v = a; v <= b; v++) set.add(`${n.bookSlug}:${n.chapter}:${v}`)
  }
  return set.size
}

const dest = join(outDir, `${SLUG}.json`)
const prev = existsSync(dest) ? JSON.parse(readFileSync(dest, 'utf8')).notes ?? [] : []

mkdirSync(outDir, { recursive: true })
writeFileSync(dest, `${JSON.stringify({ source: SOURCE, notes })}\n`)

const index = existsSync(indexPath)
  ? JSON.parse(readFileSync(indexPath, 'utf8'))
  : {
      source: SOURCE,
      seedNotes: 12,
      addedNotes: 0,
      skippedSeedOverlaps: 0,
      books: [],
      verses: 0,
      missing: [],
    }

const books = new Set(index.books ?? [])
books.add(SLUG)
const missing = (index.missing ?? []).filter((s) => s !== SLUG)

writeFileSync(
  indexPath,
  `${JSON.stringify({
    ...index,
    source: SOURCE,
    addedNotes: (index.addedNotes ?? 0) - prev.length + notes.length,
    books: [...books].sort(),
    verses: (index.verses ?? 0) - coverCount(prev) + verses.size,
    missing,
  })}\n`,
)

function sample(ch, vs) {
  const hits = notes.filter((n) => {
    if (n.chapter !== ch) return false
    if (n.range === 'intro') return vs === 1
    const m = String(n.range).match(/^(\d+)\s*[-–]\s*(\d+)$/)
    if (m) return vs >= Number(m[1]) && vs <= Number(m[2])
    return n.range === String(vs) || n.verse === vs
  })
  return `${SLUG} ${ch}:${vs} added=${hits.length} ranges=${hits.map((n) => n.range).join(',')} phrase=${JSON.stringify(hits.find((n) => n.range !== 'intro')?.webPhrase ?? '')}`
}

console.log(
  `Henry Song of Solomon: added ${notes.length} groups, ${verses.size} verses covered; other henry-books unchanged`,
)
console.log(`  ${sample(1, 1)}`)
console.log(`  ${sample(2, 1)}`)
console.log(`  ${sample(8, 6)}`)
console.log(`  ${sample(8, 14)}`)
