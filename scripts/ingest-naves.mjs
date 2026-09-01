/**
 * Nave’s Topical Bible (Orville J. Nave, 1896). Public domain.
 *
 * Source: OpenChristianData naves-topical-bible.json, CrossWire SWORD Nave v3.0
 * from the CCEL text. Original headings and verse lists only — no rewritten
 * summaries. Does not replace seed topics in src/data/naves.ts.
 *
 *   node scripts/ingest-naves.mjs
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const rawPath = join(root, 'scripts', 'raw', 'naves-topical-bible.json')
const topicDir = join(root, 'src', 'data', 'naves-topics')
const bookDir = join(root, 'src', 'data', 'naves-books')
const webPath = join(root, 'src', 'data', 'web.json')

const SOURCE =
  'Nave’s Topical Bible, Orville J. Nave, 1896 (public domain). CrossWire / CCEL complete text.'

const SEED_SLUGS = new Set([
  'faith',
  'walking',
  'grace',
  'prayer',
  'hope',
  'trust',
  'gratitude',
  'home',
  'sabbath',
  'garden',
])

const OSIS = {
  Gen: 'genesis',
  Exod: 'exodus',
  Lev: 'leviticus',
  Num: 'numbers',
  Deut: 'deuteronomy',
  Josh: 'joshua',
  Judg: 'judges',
  Ruth: 'ruth',
  '1Sam': '1-samuel',
  '2Sam': '2-samuel',
  '1Kgs': '1-kings',
  '2Kgs': '2-kings',
  '1Chr': '1-chronicles',
  '2Chr': '2-chronicles',
  Ezra: 'ezra',
  Neh: 'nehemiah',
  Esth: 'esther',
  Job: 'job',
  Ps: 'psalms',
  Prov: 'proverbs',
  Eccl: 'ecclesiastes',
  Song: 'song-of-solomon',
  Isa: 'isaiah',
  Jer: 'jeremiah',
  Lam: 'lamentations',
  Ezek: 'ezekiel',
  Dan: 'daniel',
  Hos: 'hosea',
  Joel: 'joel',
  Amos: 'amos',
  Obad: 'obadiah',
  Jonah: 'jonah',
  Mic: 'micah',
  Nah: 'nahum',
  Hab: 'habakkuk',
  Zeph: 'zephaniah',
  Hag: 'haggai',
  Zech: 'zechariah',
  Mal: 'malachi',
  Matt: 'matthew',
  Mark: 'mark',
  Luke: 'luke',
  John: 'john',
  Acts: 'acts',
  Rom: 'romans',
  '1Cor': '1-corinthians',
  '2Cor': '2-corinthians',
  Gal: 'galatians',
  Eph: 'ephesians',
  Phil: 'philippians',
  Col: 'colossians',
  '1Thess': '1-thessalonians',
  '2Thess': '2-thessalonians',
  '1Tim': '1-timothy',
  '2Tim': '2-timothy',
  Titus: 'titus',
  Phlm: 'philemon',
  Heb: 'hebrews',
  Jas: 'james',
  '1Pet': '1-peter',
  '2Pet': '2-peter',
  '1John': '1-john',
  '2John': '2-john',
  '3John': '3-john',
  Jude: 'jude',
  Rev: 'revelation',
}

const SMALL = new Set(['of', 'in', 'the', 'and', 'for', 'to', 'a', 'an', 'or', 'by', 'on', 'at'])

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function displayName(topic) {
  const raw = String(topic || '').trim()
  if (!raw) return raw
  if (raw !== raw.toUpperCase()) return raw
  const parts = raw.toLowerCase().split(/(\s+)/)
  let word = 0
  return parts
    .map((part) => {
      if (/^\s+$/.test(part)) return part
      const i = word++
      if (i > 0 && SMALL.has(part)) return part
      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join('')
}

function letterOf(slug) {
  const ch = slug[0]
  return ch && /[a-z]/.test(ch) ? ch : '0'
}

function parseOsis(spec) {
  const m = String(spec).match(
    /^([A-Za-z0-9]+)\.(\d+)\.(\d+)(?:-([A-Za-z0-9]+)\.(\d+)\.(\d+))?$/,
  )
  if (!m) return null
  return {
    startBook: m[1],
    startChapter: Number(m[2]),
    startVerse: Number(m[3]),
    endBook: m[4] || m[1],
    endChapter: Number(m[5] || m[2]),
    endVerse: Number(m[6] || m[3]),
  }
}

const dump = JSON.parse(readFileSync(rawPath, 'utf8'))
const web = JSON.parse(readFileSync(webPath, 'utf8'))
const verseCount = new Map()
const bookName = new Map()
for (const book of web.books) {
  bookName.set(book.slug, book.name)
  book.chapters.forEach((verses, ci) => {
    verseCount.set(`${book.slug}:${ci + 1}`, verses.length)
  })
}

function clampVerse(slug, chapter, verse) {
  const max = verseCount.get(`${slug}:${chapter}`)
  if (!max) return null
  if (verse < 1 || verse > max) return null
  return verse
}

function expandOsis(spec) {
  const p = parseOsis(spec)
  if (!p) return []
  if (p.startBook !== p.endBook) {
    const one = expandOsis(`${p.startBook}.${p.startChapter}.${p.startVerse}`)
    return one
  }
  const slug = OSIS[p.startBook]
  if (!slug) return []
  const out = []
  let ch = p.startChapter
  let vs = p.startVerse
  const guard = 400
  let n = 0
  while (n++ < guard) {
    const v = clampVerse(slug, ch, vs)
    if (v) out.push({ bookSlug: slug, chapter: ch, verse: v })
    if (ch === p.endChapter && vs >= p.endVerse) break
    const max = verseCount.get(`${slug}:${ch}`) ?? 0
    if (vs < max) vs += 1
    else {
      ch += 1
      vs = 1
      if (ch > p.endChapter) break
    }
  }
  return out
}

rmSync(topicDir, { recursive: true, force: true })
rmSync(bookDir, { recursive: true, force: true })
mkdirSync(topicDir, { recursive: true })
mkdirSync(bookDir, { recursive: true })

const byLetter = new Map()
const byBook = new Map()
const indexTopics = []
const verses = new Set()
let skippedApocrypha = 0
let skippedEmpty = 0
let dumpRefs = 0
let overlapSeed = 0

function bookHits(slug) {
  let map = byBook.get(slug)
  if (!map) {
    map = new Map()
    byBook.set(slug, map)
  }
  return map
}

for (const row of dump.data ?? []) {
  const slug = slugify(row.topic)
  if (!slug) continue
  if (SEED_SLUGS.has(slug)) overlapSeed += 1
  const name = displayName(row.topic)
  const related = (row.related_topics ?? []).map(slugify).filter(Boolean)
  const subtopics = []
  for (const sub of row.subtopics ?? []) {
    const label = String(sub.label || '').trim()
    if (/^see$/i.test(label) && !(sub.references ?? []).length) continue
    const grouped = []
    for (const item of sub.references ?? []) {
      const osis = item.osis ?? []
      if (!osis.length) {
        skippedEmpty += 1
        continue
      }
      for (const spec of osis) {
        const p = parseOsis(spec)
        if (p && !OSIS[p.startBook]) {
          skippedApocrypha += 1
          continue
        }
        const expanded = expandOsis(spec)
        if (!expanded.length) {
          skippedEmpty += 1
          continue
        }
        const first = expanded[0]
        const last = expanded[expanded.length - 1]
        const sameChapter = first.bookSlug === last.bookSlug && first.chapter === last.chapter
        const ref = {
          bookSlug: first.bookSlug,
          chapter: first.chapter,
          verse: first.verse,
          ...(sameChapter && last.verse !== first.verse ? { verseEnd: last.verse } : {}),
        }
        grouped.push(ref)
        dumpRefs += 1
        for (const hit of expanded) {
          verses.add(`${hit.bookSlug}:${hit.chapter}:${hit.verse}`)
          const key = `${hit.chapter}:${hit.verse}`
          const map = bookHits(hit.bookSlug)
          const list = map.get(key) ?? []
          if (!list.some((h) => h.slug === slug)) {
            list.push({ slug, name, label })
            map.set(key, list)
          }
        }
      }
    }
    if (!grouped.length && !label) continue
    subtopics.push({ label, refs: grouped })
  }
  if (!subtopics.length && !related.length) continue
  const topic = { slug, name, related, subtopics }
  const letter = letterOf(slug)
  const bucket = byLetter.get(letter) ?? []
  bucket.push(topic)
  byLetter.set(letter, bucket)
  indexTopics.push({ slug, name })
}

indexTopics.sort((a, b) => a.name.localeCompare(b.name))

for (const [letter, topics] of byLetter) {
  topics.sort((a, b) => a.name.localeCompare(b.name))
  writeFileSync(join(topicDir, `${letter}.json`), `${JSON.stringify({ source: SOURCE, topics })}\n`)
}

const books = []
for (const [slug, map] of [...byBook.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const hits = [...map.entries()]
    .map(([key, topics]) => {
      const [chapter, verse] = key.split(':').map(Number)
      return { chapter, verse, topics }
    })
    .sort((a, b) => a.chapter - b.chapter || a.verse - b.verse)
  books.push(slug)
  writeFileSync(join(bookDir, `${slug}.json`), `${JSON.stringify({ source: SOURCE, hits })}\n`)
}

writeFileSync(
  join(root, 'src', 'data', 'naves-index.json'),
  `${JSON.stringify({
    source: SOURCE,
    seedTopics: SEED_SLUGS.size,
    dumpTopics: indexTopics.length,
    overlappingSeedSlugs: overlapSeed,
    skippedApocrypha,
    skippedEmpty,
    refs: dumpRefs,
    verses: verses.size,
    books,
    letters: [...byLetter.keys()].sort(),
    topics: indexTopics,
  })}\n`,
)

function sample(slug, ch, vs) {
  const hits = byBook.get(slug)?.get(`${ch}:${vs}`) ?? []
  return `${slug} ${ch}:${vs} topics=${hits.length} ${hits
    .slice(0, 6)
    .map((h) => h.name)
    .join('; ')}`
}

console.log(
  `Nave 1896: kept ${SEED_SLUGS.size} seed topics, added ${indexTopics.length} dump topics, ${overlapSeed} seed-slug overlaps kept as extra, ${verses.size} verses, ${dumpRefs} refs, skipped apocrypha ${skippedApocrypha}`,
)
console.log(`  ${sample('john', 3, 16)}`)
console.log(`  ${sample('genesis', 1, 1)}`)
console.log(`  ${sample('hebrews', 11, 1)}`)
console.log(`  ${sample('exodus', 20, 8)}`)
