/**
 * Original Treasury of Scripture Knowledge (Canne, Browne, Blayney, Scott, ~1880).
 * Source: JustVerses TSK dump (public domain verse lists + KJV anchor phrases).
 * Not expanded TSKe marketing text.
 *
 * Seed (default): John 3, Matthew 4, 2 Corinthians 5, Hebrews 11, Psalm 23
 *   -> src/data/tsk.json for the reader.
 *
 * Full load into Supabase public.tsk (later):
 *   1. Keep tskxref.txt in scripts/raw/ (gitignored).
 *   2. node scripts/ingest-tsk.mjs --all-sql
 *   3. Apply tmp-web/tsk-full.sql as a data migration (RLS already allows SELECT).
 * The app keeps reading the local seed so logged-out John 3 still works
 * until the full table is loaded and the client is pointed at it.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const rawPath = join(root, 'scripts', 'raw', 'tskxref.txt')
const webPath = join(root, 'src', 'data', 'web.json')
const outJson = join(root, 'src', 'data', 'tsk.json')

const BOOK_BY_KEY = [
  '',
  'genesis',
  'exodus',
  'leviticus',
  'numbers',
  'deuteronomy',
  'joshua',
  'judges',
  'ruth',
  '1-samuel',
  '2-samuel',
  '1-kings',
  '2-kings',
  '1-chronicles',
  '2-chronicles',
  'ezra',
  'nehemiah',
  'esther',
  'job',
  'psalms',
  'proverbs',
  'ecclesiastes',
  'song-of-solomon',
  'isaiah',
  'jeremiah',
  'lamentations',
  'ezekiel',
  'daniel',
  'hosea',
  'joel',
  'amos',
  'obadiah',
  'jonah',
  'micah',
  'nahum',
  'habakkuk',
  'zephaniah',
  'haggai',
  'zechariah',
  'malachi',
  'matthew',
  'mark',
  'luke',
  'john',
  'acts',
  'romans',
  '1-corinthians',
  '2-corinthians',
  'galatians',
  'ephesians',
  'philippians',
  'colossians',
  '1-thessalonians',
  '2-thessalonians',
  '1-timothy',
  '2-timothy',
  'titus',
  'philemon',
  'hebrews',
  'james',
  '1-peter',
  '2-peter',
  '1-john',
  '2-john',
  '3-john',
  'jude',
  'revelation',
]

const ABBR = {
  ge: 'genesis',
  ex: 'exodus',
  le: 'leviticus',
  nu: 'numbers',
  de: 'deuteronomy',
  jos: 'joshua',
  jud: 'judges',
  ru: 'ruth',
  '1sa': '1-samuel',
  '2sa': '2-samuel',
  '1ki': '1-kings',
  '2ki': '2-kings',
  '1ch': '1-chronicles',
  '2ch': '2-chronicles',
  ezr: 'ezra',
  ne: 'nehemiah',
  es: 'esther',
  job: 'job',
  ps: 'psalms',
  pr: 'proverbs',
  ec: 'ecclesiastes',
  so: 'song-of-solomon',
  isa: 'isaiah',
  jer: 'jeremiah',
  la: 'lamentations',
  eze: 'ezekiel',
  da: 'daniel',
  ho: 'hosea',
  joe: 'joel',
  am: 'amos',
  ob: 'obadiah',
  jon: 'jonah',
  mic: 'micah',
  na: 'nahum',
  hab: 'habakkuk',
  zep: 'zephaniah',
  hag: 'haggai',
  zec: 'zechariah',
  mal: 'malachi',
  mt: 'matthew',
  mr: 'mark',
  lu: 'luke',
  joh: 'john',
  ac: 'acts',
  ro: 'romans',
  '1co': '1-corinthians',
  '2co': '2-corinthians',
  ga: 'galatians',
  eph: 'ephesians',
  php: 'philippians',
  col: 'colossians',
  '1th': '1-thessalonians',
  '2th': '2-thessalonians',
  '1ti': '1-timothy',
  '2ti': '2-timothy',
  tit: 'titus',
  phm: 'philemon',
  heb: 'hebrews',
  jas: 'james',
  '1pe': '1-peter',
  '2pe': '2-peter',
  '1jo': '1-john',
  '2jo': '2-john',
  '3jo': '3-john',
  jude: 'jude',
  re: 'revelation',
}

const SEED = [
  [43, 3],
  [40, 4],
  [47, 5],
  [58, 11],
  [19, 23],
]

const SWAPS = [
  [/whosoever/gi, 'whoever'],
  [/believeth/gi, 'believes'],
  [/everlasting/gi, 'eternal'],
  [/only begotten/gi, 'only born'],
  [/Holy Ghost/gi, 'Holy Spirit'],
  [/\bhath\b/gi, 'has'],
  [/\bdoth\b/gi, 'does'],
  [/\bsaith\b/gi, 'says'],
]

function phraseSpan(text, phrase) {
  const needle = phrase.trim()
  if (!needle) return null
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
  const m = text.match(new RegExp(escaped, 'i'))
  if (!m || m.index == null) return null
  return { start: m.index, end: m.index + m[0].length }
}

function attachWeb(webText, kjvPhrase) {
  if (!webText) return ''
  const candidates = [kjvPhrase]
  let swapped = kjvPhrase
  for (const [re, to] of SWAPS) swapped = swapped.replace(re, to)
  if (swapped !== kjvPhrase) candidates.push(swapped)
  for (const c of candidates) {
    if (c.length > webText.length + 8) continue
    const span = phraseSpan(webText, c)
    if (span) return webText.slice(span.start, span.end)
  }
  return ''
}

function parseVerseChunk(chunk) {
  const m = chunk.trim().match(/^(\d+)(?:-(\d+))?$/)
  if (!m) return []
  const start = Number(m[1])
  const end = m[2] ? Number(m[2]) : start
  if (!start || end < start) return []
  return [{ verse: start, verseEnd: end === start ? undefined : end }]
}

function parseRefs(list) {
  if (!list) return []
  const out = []
  for (const token of list.split(';')) {
    const t = token.trim().toLowerCase()
    if (!t) continue
    const m = t.match(/^(\d?[a-z]+)\s+(\d+):(.+)$/)
    if (!m) continue
    const bookSlug = ABBR[m[1]]
    if (!bookSlug) continue
    const chapter = Number(m[2])
    if (!chapter) continue
    for (const part of m[3].split(',')) {
      for (const hit of parseVerseChunk(part)) {
        out.push({ bookSlug, chapter, verse: hit.verse, verseEnd: hit.verseEnd })
      }
    }
  }
  return out
}

function loadWeb() {
  const web = JSON.parse(readFileSync(webPath, 'utf8'))
  const map = new Map()
  for (const book of web.books) {
    book.chapters.forEach((verses, ci) => {
      verses.forEach((text, vi) => {
        map.set(`${book.slug}:${ci + 1}:${vi + 1}`, text)
      })
    })
  }
  return map
}

function parseTsk(all) {
  const web = loadWeb()
  const groups = []
  const lines = readFileSync(rawPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    if (!line) continue
    const [bookKey, chapter, verse, sortOrder, word, refs] = line.split('\t')
    const key = Number(bookKey)
    const ch = Number(chapter)
    const vs = Number(verse)
    if (!BOOK_BY_KEY[key]) continue
    if (!all && !SEED.some(([b, c]) => b === key && c === ch)) continue
    const kjvPhrase = (word ?? '').trim()
    const bookSlug = BOOK_BY_KEY[key]
    const webText = web.get(`${bookSlug}:${ch}:${vs}`) ?? ''
    groups.push({
      bookSlug,
      chapter: ch,
      verse: vs,
      sortOrder: Number(sortOrder) || 0,
      kjvPhrase,
      webPhrase: attachWeb(webText, kjvPhrase),
      refs: parseRefs(refs ?? ''),
    })
  }
  return groups
}

function sqlEscape(s) {
  return s.replaceAll("'", "''")
}

function toSql(groups) {
  const chunks = []
  const batch = 40
  for (let i = 0; i < groups.length; i += batch) {
    const rows = groups.slice(i, i + batch).map((g) => {
      const refs = JSON.stringify(g.refs).replaceAll("'", "''")
      return `( '${sqlEscape(g.bookSlug)}', ${g.chapter}, ${g.verse}, ${g.sortOrder}, '${sqlEscape(g.kjvPhrase)}', '${sqlEscape(g.webPhrase)}', '${refs}'::jsonb )`
    })
    chunks.push(
      `insert into public.tsk (book_slug, chapter, verse, sort_order, kjv_phrase, web_phrase, refs) values\n${rows.join(',\n')};`,
    )
  }
  return chunks.join('\n\n')
}

const all = process.argv.includes('--all-sql')
const groups = parseTsk(all)
const payload = {
  source:
    'Treasury of Scripture Knowledge (Canne, Browne, Blayney, Scott, and others, ca. 1880). Public domain. Original verse lists and KJV anchor phrases from the JustVerses TSK dump.',
  seed: all
    ? 'all'
    : [
        ['john', 3],
        ['matthew', 4],
        ['2-corinthians', 5],
        ['hebrews', 11],
        ['psalms', 23],
      ],
  groups,
}

writeFileSync(outJson, `${JSON.stringify(payload)}\n`)
console.log(`Wrote ${groups.length} TSK groups to src/data/tsk.json`)

mkdirSync(join(root, 'tmp-web'), { recursive: true })
const sqlPath = join(root, 'tmp-web', all ? 'tsk-full.sql' : 'tsk-seed.sql')
writeFileSync(sqlPath, `${toSql(groups)}\n`)
console.log(`Wrote SQL to ${sqlPath}`)
