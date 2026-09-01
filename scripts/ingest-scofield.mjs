/**
 * Scofield Reference Bible notes, 1917 (public domain).
 * Source: CrossWire Sword module (Wikisource 1917 text). Never the 1967 New Scofield.
 *
 * Adds notes beside the existing seed in src/data/scofield.ts. Does not replace
 * seed wording. webPhrase is filled only when the 1917 headword already sits in
 * our WEB (LORD) line.
 *
 *   node scripts/ingest-scofield.mjs
 */
import { inflateSync } from 'node:zlib'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const webPath = join(root, 'src', 'data', 'web.json')
const moduleDir = join(root, 'scripts', 'raw', 'scofield', 'sword', 'modules', 'comments', 'zcom', 'scofield')
const outDir = join(root, 'src', 'data', 'scofield-books')
const seedPath = join(root, 'src', 'data', 'scofield.ts')

const SOURCE =
  'Scofield Reference Bible notes, 1917 (public domain). CrossWire module from the Wikisource 1917 text. Not the 1967 New Scofield.'

const ABBR = {
  gen: 'genesis',
  ge: 'genesis',
  genesis: 'genesis',
  exod: 'exodus',
  exo: 'exodus',
  ex: 'exodus',
  exodus: 'exodus',
  lev: 'leviticus',
  le: 'leviticus',
  leviticus: 'leviticus',
  num: 'numbers',
  nu: 'numbers',
  numbers: 'numbers',
  deut: 'deuteronomy',
  de: 'deuteronomy',
  dt: 'deuteronomy',
  deuteronomy: 'deuteronomy',
  josh: 'joshua',
  jos: 'joshua',
  joshua: 'joshua',
  judg: 'judges',
  jud: 'judges',
  jdg: 'judges',
  judges: 'judges',
  ruth: 'ruth',
  ru: 'ruth',
  '1sam': '1-samuel',
  '1sa': '1-samuel',
  '1samuel': '1-samuel',
  '2sam': '2-samuel',
  '2sa': '2-samuel',
  '2samuel': '2-samuel',
  '1kgs': '1-kings',
  '1ki': '1-kings',
  '1kings': '1-kings',
  '2kgs': '2-kings',
  '2ki': '2-kings',
  '2kings': '2-kings',
  '1chr': '1-chronicles',
  '1ch': '1-chronicles',
  '1chronicles': '1-chronicles',
  '2chr': '2-chronicles',
  '2ch': '2-chronicles',
  '2chronicles': '2-chronicles',
  ezra: 'ezra',
  ezr: 'ezra',
  neh: 'nehemiah',
  ne: 'nehemiah',
  nehemiah: 'nehemiah',
  esth: 'esther',
  es: 'esther',
  esther: 'esther',
  job: 'job',
  ps: 'psalms',
  psa: 'psalms',
  psalm: 'psalms',
  psalms: 'psalms',
  prov: 'proverbs',
  pr: 'proverbs',
  proverbs: 'proverbs',
  eccl: 'ecclesiastes',
  ec: 'ecclesiastes',
  ecc: 'ecclesiastes',
  ecclesiastes: 'ecclesiastes',
  song: 'song-of-solomon',
  so: 'song-of-solomon',
  cant: 'song-of-solomon',
  isa: 'isaiah',
  is: 'isaiah',
  isaiah: 'isaiah',
  jer: 'jeremiah',
  je: 'jeremiah',
  jeremiah: 'jeremiah',
  lam: 'lamentations',
  la: 'lamentations',
  lamentations: 'lamentations',
  ezek: 'ezekiel',
  eze: 'ezekiel',
  ezk: 'ezekiel',
  ezekiel: 'ezekiel',
  dan: 'daniel',
  da: 'daniel',
  daniel: 'daniel',
  hos: 'hosea',
  ho: 'hosea',
  hosea: 'hosea',
  joel: 'joel',
  joe: 'joel',
  jol: 'joel',
  amos: 'amos',
  am: 'amos',
  obad: 'obadiah',
  ob: 'obadiah',
  obadiah: 'obadiah',
  jonah: 'jonah',
  jon: 'jonah',
  mic: 'micah',
  micah: 'micah',
  nah: 'nahum',
  nam: 'nahum',
  nahum: 'nahum',
  hab: 'habakkuk',
  habakkuk: 'habakkuk',
  zeph: 'zephaniah',
  zep: 'zephaniah',
  zephaniah: 'zephaniah',
  hag: 'haggai',
  haggai: 'haggai',
  zech: 'zechariah',
  zec: 'zechariah',
  zechariah: 'zechariah',
  mal: 'malachi',
  malachi: 'malachi',
  matt: 'matthew',
  mat: 'matthew',
  mt: 'matthew',
  matthew: 'matthew',
  mark: 'mark',
  mr: 'mark',
  mrk: 'mark',
  mk: 'mark',
  luke: 'luke',
  lu: 'luke',
  luk: 'luke',
  lk: 'luke',
  john: 'john',
  joh: 'john',
  jhn: 'john',
  jn: 'john',
  acts: 'acts',
  ac: 'acts',
  act: 'acts',
  rom: 'romans',
  ro: 'romans',
  romans: 'romans',
  '1cor': '1-corinthians',
  '1co': '1-corinthians',
  '1corinthians': '1-corinthians',
  '2cor': '2-corinthians',
  '2co': '2-corinthians',
  '2corinthians': '2-corinthians',
  gal: 'galatians',
  ga: 'galatians',
  galatians: 'galatians',
  eph: 'ephesians',
  ephesians: 'ephesians',
  phil: 'philippians',
  php: 'philippians',
  ph: 'philippians',
  philippians: 'philippians',
  col: 'colossians',
  colossians: 'colossians',
  '1thess': '1-thessalonians',
  '1th': '1-thessalonians',
  '1thessalonians': '1-thessalonians',
  '2thess': '2-thessalonians',
  '2th': '2-thessalonians',
  '2thessalonians': '2-thessalonians',
  '1tim': '1-timothy',
  '1ti': '1-timothy',
  '1timothy': '1-timothy',
  '2tim': '2-timothy',
  '2ti': '2-timothy',
  '2timothy': '2-timothy',
  titus: 'titus',
  tit: 'titus',
  phlm: 'philemon',
  phm: 'philemon',
  philemon: 'philemon',
  heb: 'hebrews',
  hebrews: 'hebrews',
  jas: 'james',
  jam: 'james',
  james: 'james',
  '1pet': '1-peter',
  '1pe': '1-peter',
  '1peter': '1-peter',
  '2pet': '2-peter',
  '2pe': '2-peter',
  '2peter': '2-peter',
  '1john': '1-john',
  '1jo': '1-john',
  '1jn': '1-john',
  '2john': '2-john',
  '2jo': '2-john',
  '2jn': '2-john',
  '3john': '3-john',
  '3jo': '3-john',
  '3jn': '3-john',
  jude: 'jude',
  rev: 'revelation',
  re: 'revelation',
  revelation: 'revelation',
}

const SWAPS = [
  [/whosoever/gi, 'whoever'],
  [/believeth/gi, 'believes'],
  [/everlasting/gi, 'eternal'],
  [/only begotten/gi, 'only born'],
  [/Holy Ghost/gi, 'Holy Spirit'],
  [/\bhath\b/gi, 'has'],
  [/\bdoth\b/gi, 'does'],
  [/\bsaith\b/gi, 'says'],
  [/\bwithout form and void\b/gi, 'waste and empty'],
  [/\bfirmament\b/gi, 'expanse'],
]

function u32(buf, i) {
  return buf.readUInt32LE(i)
}
function u16(buf, i) {
  return buf.readUInt16LE(i)
}

function phraseSpan(text, phrase) {
  const needle = phrase.trim()
  if (!needle) return null
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
  const m = text.match(new RegExp(escaped, 'i'))
  if (!m || m.index == null) return null
  return { start: m.index, end: m.index + m[0].length }
}

function attachWeb(webText, kjvPhrase) {
  if (!webText || !kjvPhrase) return ''
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

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/—/g, '—')
}

function osisToText(xml) {
  let s = decodeEntities(xml)
  s = s.replace(/<reference[^>]*>([\s\S]*?)<\/reference>/gi, '$1')
  s = s.replace(/<w[^>]*>([\s\S]*?)<\/w>/gi, '$1')
  s = s.replace(/<hi type="italic">([\s\S]*?)<\/hi>/gi, '$1')
  s = s.replace(/<hi type="bold">([\s\S]*?)<\/hi>/gi, '$1')
  s = s.replace(/<title[^>]*>([\s\S]*?)<\/title>/gi, '$1. ')
  s = s.replace(/<item[^>]*>([\s\S]*?)<\/item>/gi, '\n$1')
  s = s.replace(/<div[^>]*\/>/gi, ' ')
  s = s.replace(/<[^>]+>/g, ' ')
  s = s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n')
  s = s.replace(/[ \t]{2,}/g, ' ').replace(/\n /g, '\n').trim()
  return s
}

function parseOsisRefs(xml) {
  const out = []
  const re = /(?:Scofield:)?(\d?[A-Za-z]+)\s+(\d+)(?::(\d+)(?:-(\d+))?)?/g
  for (const m of String(xml).matchAll(re)) {
    const bookSlug = ABBR[m[1].toLowerCase()]
    if (!bookSlug) continue
    const chapter = Number(m[2])
    const verse = m[3] ? Number(m[3]) : 1
    if (!chapter) continue
    out.push({ bookSlug, chapter, verse })
  }
  return out
}

function seeAlsoFrom(xml) {
  const hits = []
  const re = /osisRef="Scofield:([^"]+)"/gi
  for (const m of xml.matchAll(re)) hits.push(...parseOsisRefs(m[1].replace(/([A-Za-z])(\d)/g, '$1 $2')))
  if (hits.length) return uniqRefs(hits)
  return []
}

function uniqRefs(refs) {
  const seen = new Set()
  const out = []
  for (const r of refs) {
    const k = `${r.bookSlug}:${r.chapter}:${r.verse}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push(r)
  }
  return out
}

function pushNote(notes, heading, kjvPhrase, xml) {
  let body = osisToText(xml).replace(/^Read first chapter of \S+\s*/i, '').trim()
  if (body.length < 24) return
  if (/^\(?see scofield\b/i.test(body) && body.length < 80) return
  notes.push({
    heading: heading.trim() || undefined,
    kjvPhrase: kjvPhrase.trim(),
    xml,
    body,
  })
}

function extractNotes(xml) {
  const notes = []
  let rest = xml
  const title = rest.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (title && title.index != null) {
    const heading = osisToText(title[1])
    const after = rest.slice(title.index + title[0].length)
    const next = after.search(/<hi type="(bold|italic)"/i)
    const introXml = next >= 0 ? after.slice(0, next) : after
    pushNote(notes, heading, '', introXml)
    rest = next >= 0 ? after.slice(next) : ''
  }
  if (!rest.trim()) return notes

  const firstBold = rest.search(/<hi type="bold">/i)
  const italicLead = rest.match(/^(?:[\s]|<div[^>]*>|<div[^>]*\/>)*<hi type="italic">([^<]{1,48})<\/hi>/i)
  if (italicLead && (firstBold < 0 || rest.indexOf(italicLead[0]) < firstBold)) {
    const end = firstBold >= 0 ? firstBold : rest.length
    const phrase = decodeEntities(italicLead[1]).trim()
    if (!/^(see scofield|e\.g\.|i\.e\.|cf\.)$/i.test(phrase)) {
      pushNote(notes, phrase, phrase, rest.slice(0, end))
    }
    rest = firstBold >= 0 ? rest.slice(firstBold) : ''
  }

  const chunks = rest.split(/(?=<hi type="bold">)/i).filter((c) => c.trim())
  for (const chunk of chunks) {
    const m = chunk.match(/^<hi type="bold">([^<]*)<\/hi>([\s\S]*)/i)
    if (m) pushNote(notes, decodeEntities(m[1]).trim(), decodeEntities(m[1]).trim(), m[2])
    else pushNote(notes, '', '', chunk)
  }
  return notes.filter((n) => n.body)
}

function loadSword(which) {
  const bzs = readFileSync(join(moduleDir, `${which}.bzs`))
  const bzz = readFileSync(join(moduleDir, `${which}.bzz`))
  const bzv = readFileSync(join(moduleDir, `${which}.bzv`))
  const blocks = []
  for (let i = 0; i < bzs.length; i += 12) {
    blocks.push({ off: u32(bzs, i), z: u32(bzs, i + 4) })
  }
  const cache = new Map()
  function block(n) {
    if (cache.has(n)) return cache.get(n)
    const rec = blocks[n]
    const raw = inflateSync(bzz.subarray(rec.off, rec.off + rec.z))
    cache.set(n, raw)
    return raw
  }
  const texts = []
  for (let i = 0; i < bzv.length / 10; i++) {
    const buff = u32(bzv, i * 10)
    const start = u32(bzv, i * 10 + 4)
    const size = u16(bzv, i * 10 + 8)
    texts.push(size ? block(buff).subarray(start, start + size).toString('utf8') : '')
  }
  return texts
}

function verseSlots(books) {
  const map = []
  map.push({ bookSlug: '_mod', chapter: 0, verse: 0 })
  map.push({ bookSlug: '_test', chapter: 0, verse: 0 })
  for (const b of books) {
    map.push({ bookSlug: b.slug, chapter: 0, verse: 0 })
    b.chapters.forEach((ch, ci) => {
      map.push({ bookSlug: b.slug, chapter: ci + 1, verse: 0 })
      for (let v = 1; v <= ch.length; v++) map.push({ bookSlug: b.slug, chapter: ci + 1, verse: v })
    })
  }
  return map
}

function loadSeed() {
  const src = readFileSync(seedPath, 'utf8')
  const notes = []
  const re =
    /bookSlug: '([^']+)',\s*chapter: (\d+),\s*verse: (\d+),[\s\S]*?kjvPhrase: '([^']*)',[\s\S]*?webPhrase: '([^']*)',[\s\S]*?body: `([^`]*)`|bookSlug: '([^']+)',\s*chapter: (\d+),\s*verse: (\d+),[\s\S]*?kjvPhrase: '([^']*)',[\s\S]*?webPhrase: '([^']*)',[\s\S]*?body: '([^']*)'/g
  for (const m of src.matchAll(re)) {
    if (m[1]) {
      notes.push({
        bookSlug: m[1],
        chapter: Number(m[2]),
        verse: Number(m[3]),
        kjvPhrase: m[4],
        webPhrase: m[5],
        body: m[6],
      })
    } else {
      notes.push({
        bookSlug: m[7],
        chapter: Number(m[8]),
        verse: Number(m[9]),
        kjvPhrase: m[10],
        webPhrase: m[11],
        body: m[12],
      })
    }
  }
  return notes
}

function collides(note, seedOnVerse) {
  for (const s of seedOnVerse) {
    const phrase = fold(note.kjvPhrase)
    if (phrase && (phrase === fold(s.kjvPhrase) || phrase === fold(s.webPhrase) || phrase === fold(s.heading))) {
      return true
    }
    if (note.heading && fold(note.heading) === fold(s.heading)) return true
    if (overlaps(note.body, s.body)) return true
  }
  return false
}

function nextLetter(used) {
  for (let i = 0; i < 26; i++) {
    const L = String.fromCharCode(97 + i)
    if (!used.has(L)) return L
  }
  return 'a'
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

const seed = loadSeed()
if (seed.length < 10) {
  throw new Error(`Failed to read seed notes from scofield.ts (got ${seed.length})`)
}
const seedByVerse = new Map()
for (const n of seed) {
  const k = `${n.bookSlug}:${n.chapter}:${n.verse}`
  const list = seedByVerse.get(k) ?? []
  list.push(n)
  seedByVerse.set(k, list)
}

const otBooks = web.books.slice(0, 39)
const ntBooks = web.books.slice(39)
const jobs = [
  [otBooks, loadSword('ot')],
  [ntBooks, loadSword('nt')],
]

const added = []
let skipped = 0
for (const [books, texts] of jobs) {
  const slots = verseSlots(books)
  if (slots.length !== texts.length) {
    throw new Error(`Index mismatch ${slots.length} vs ${texts.length}`)
  }
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    const xml = texts[i]
    if (!xml || slot.chapter < 1 || slot.verse < 1) continue
    if (/^[\s<]*(?:<(?:div|chapter|milestone)[^>]*\/?>[\s]*)+$/i.test(xml) && xml.length < 400) continue
    const webText = webMap.get(`${slot.bookSlug}:${slot.chapter}:${slot.verse}`) ?? ''
    const seedOnVerse = seedByVerse.get(`${slot.bookSlug}:${slot.chapter}:${slot.verse}`) ?? []
    const used = new Set(seedOnVerse.map((n) => n.letter).filter(Boolean))
    for (const raw of extractNotes(xml)) {
      if (collides(raw, seedOnVerse)) {
        skipped += 1
        continue
      }
      const webPhrase = attachWeb(webText, raw.kjvPhrase)
      const seeAlso = seeAlsoFrom(raw.xml)
      const letter = nextLetter(used)
      used.add(letter)
      added.push({
        bookSlug: slot.bookSlug,
        chapter: slot.chapter,
        verse: slot.verse,
        heading: raw.heading,
        body: raw.body,
        kjvPhrase: raw.kjvPhrase,
        webPhrase,
        letter,
        kind: seeAlso.length ? 'chain' : webPhrase ? 'word' : 'verse',
        seeAlso,
      })
    }
  }
}

mkdirSync(outDir, { recursive: true })
const byBook = new Map()
for (const n of added) {
  const list = byBook.get(n.bookSlug) ?? []
  list.push(n)
  byBook.set(n.bookSlug, list)
}
for (const [slug, list] of byBook) {
  writeFileSync(join(outDir, `${slug}.json`), `${JSON.stringify({ source: SOURCE, notes: list })}\n`)
}

const verses = new Set([
  ...seed.map((n) => `${n.bookSlug}:${n.chapter}:${n.verse}`),
  ...added.map((n) => `${n.bookSlug}:${n.chapter}:${n.verse}`),
])
writeFileSync(
  join(root, 'src', 'data', 'scofield-index.json'),
  `${JSON.stringify({
    source: SOURCE,
    seedNotes: seed.length,
    addedNotes: added.length,
    skippedSeedOverlaps: skipped,
    books: [...byBook.keys()].sort(),
    verses: verses.size,
  })}\n`,
)

function sample(slug, ch, vs) {
  const seedN = seed.filter((n) => n.bookSlug === slug && n.chapter === ch && n.verse === vs)
  const addN = added.filter((n) => n.bookSlug === slug && n.chapter === ch && n.verse === vs)
  return `${slug} ${ch}:${vs} seed=${seedN.length} added=${addN.length} headings=${[...seedN, ...addN].map((n) => n.heading || n.kjvPhrase || 'verse').join(' | ')}`
}

console.log(
  `Scofield 1917: kept ${seed.length} seed notes, added ${added.length} notes, skipped ${skipped} overlaps, ${verses.size} verses with notes, ${byBook.size} books`,
)
console.log(`  ${sample('genesis', 1, 1)}`)
console.log(`  ${sample('john', 3, 16)}`)
console.log(`  ${sample('matthew', 4, 8)}`)
