/**
 * Short chapter lines from Matthew Henry’s own chapter openings (public domain).
 * Scofield 1917 headings fill a few gaps. Do not invent titles.
 */
import fs from 'fs'
import path from 'path'

const DATA = path.resolve(import.meta.dirname, '../src/data')
const web = JSON.parse(fs.readFileSync(path.join(DATA, 'web.json'), 'utf8'))

function clipWords(s, n = 16) {
  const words = s.split(/\s+/).filter(Boolean)
  if (words.length <= n) return words.join(' ')
  return `${words.slice(0, n).join(' ').replace(/[,:;]+$/, '')}…`
}

function synopsis(body) {
  let s = String(body ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  s = s.replace(/^An Exposition,[^.]*\.\s*/i, '')
  s = s.replace(/^An Exposition with Practical Observations of [^.]*\.\s*/i, '')
  s = s.replace(/\b([IVX]+)\.\s*/g, '')
  if (s.length < 24) return ''
  const m = s.match(/^.{24,180}?[.!?](?=\s|$)/)
  let t = (m ? m[0] : s).replace(/\s+/g, ' ').trim()
  if (/^(we have here|in this chapter we have)\.?$/i.test(t)) return ''
  t = clipWords(t, 16)
  if (t.length < 20) return ''
  return t
}

function pickHenry(notes, chapter) {
  const intros = notes.filter((n) => n.chapter === chapter && n.range === 'intro').map((n) => n.body)
  const bodies = chapter === 1 && intros.length > 1 ? intros.slice(1) : intros
  const scored = bodies.map(synopsis).filter(Boolean)
  const prefer = scored.find((t) => /this (chapter|psalm|epistle|book|prophecy|gospel)/i.test(t))
  if (prefer) return prefer
  if (scored[0]) return scored[0]
  const first = notes.find((n) => n.chapter === chapter && n.range !== 'intro')
  return first ? synopsis(first.body) : ''
}

function pickScofield(notes, chapter) {
  for (const n of notes) {
    if (n.chapter !== chapter) continue
    const heading = String(n.heading || '').trim()
    if (!heading || heading.length < 3 || heading.length > 48) continue
    if (/^Book Introduction/i.test(heading)) continue
    if (heading === n.kjvPhrase) continue
    return heading
  }
  return ''
}

const books = {}
let henryN = 0
let scoN = 0
let empty = []

for (const b of web.books) {
  const henry = JSON.parse(fs.readFileSync(path.join(DATA, 'henry-books', `${b.slug}.json`), 'utf8'))
  let sco = { notes: [] }
  const scoPath = path.join(DATA, 'scofield-books', `${b.slug}.json`)
  if (fs.existsSync(scoPath)) sco = JSON.parse(fs.readFileSync(scoPath, 'utf8'))
  const titles = []
  for (let c = 1; c <= b.chapters.length; c++) {
    let t = pickHenry(henry.notes ?? [], c)
    let src = t ? 'henry' : ''
    if (!t) {
      t = pickScofield(sco.notes ?? [], c)
      if (t) src = 'scofield'
    }
    if (t) {
      if (src === 'henry') henryN += 1
      else scoN += 1
    } else empty.push(`${b.slug} ${c}`)
    titles.push(t)
  }
  books[b.slug] = titles
}

const out = {
  source: 'Matthew Henry chapter openings (1706–1721), public domain. Scofield 1917 headings only where Henry has no chapter opening.',
  henry: henryN,
  scofield: scoN,
  empty: empty.length,
  books,
}
fs.writeFileSync(path.join(DATA, 'chapter-titles.json'), JSON.stringify(out))
console.log({ books: Object.keys(books).length, henryN, scoN, empty: empty.length, missing: empty })
console.log('genesis 1-4', books.genesis.slice(0, 4))
console.log('john 1-4', books.john.slice(0, 4))
console.log('psalms 1-3', books.psalms.slice(0, 3))
