/**
 * Compact search indexes for Scofield, Henry, and TSK.
 * Headings/phrases and short previews only — not full commentary bodies.
 */
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(import.meta.dirname, '..')
const DATA = path.join(ROOT, 'src', 'data')

function clip(s, n) {
  const t = String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  if (t.length <= n) return t
  return `${t.slice(0, n).trim()}…`
}

function hay(s, n) {
  return clip(s, n).toLowerCase()
}

function readBooks(dir, field) {
  const folder = path.join(DATA, dir)
  const out = []
  for (const name of fs.readdirSync(folder).filter((f) => f.endsWith('.json')).sort()) {
    const payload = JSON.parse(fs.readFileSync(path.join(folder, name), 'utf8'))
    const rows = payload[field] ?? []
    for (const row of rows) out.push(row)
  }
  return out
}

function writeJson(file, data) {
  const dest = path.join(DATA, file)
  fs.writeFileSync(dest, JSON.stringify(data))
  const kb = Math.round(fs.statSync(dest).size / 1024)
  console.log(`${file}  ${kb} KB  ${Array.isArray(data) ? data.length : data.rows?.length} rows`)
}

const scofield = []
const seenSco = new Set()
for (const n of readBooks('scofield-books', 'notes')) {
  const title = clip(n.heading || n.kjvPhrase || n.webPhrase || '', 80)
  if (!title) continue
  const key = `${n.bookSlug}:${n.chapter}:${n.verse}:${title.toLowerCase()}`
  if (seenSco.has(key)) continue
  seenSco.add(key)
  scofield.push({
    t: title,
    b: n.bookSlug,
    c: n.chapter,
    v: n.verse,
    s: clip(n.body, 160),
  })
}

const henry = []
for (const n of readBooks('henry-books', 'notes')) {
  if (n.range === 'intro') continue
  const body = String(n.body ?? '').replace(/\s+/g, ' ').trim()
  if (body.length < 40) continue
  henry.push({
    b: n.bookSlug,
    c: n.chapter,
    v: n.verse,
    r: n.range || '',
    s: clip(body, 180),
    h: hay(body, 420),
  })
}

const tsk = []
const seenTsk = new Set()
for (const g of readBooks('tsk-books', 'groups')) {
  const phrase = clip(g.kjvPhrase || g.webPhrase || '', 80)
  if (phrase.length < 3) continue
  const key = `${phrase.toLowerCase()}:${g.bookSlug}:${g.chapter}:${g.verse}`
  if (seenTsk.has(key)) continue
  seenTsk.add(key)
  tsk.push({
    t: phrase,
    b: g.bookSlug,
    c: g.chapter,
    v: g.verse,
  })
}

writeJson('search-scofield.json', { source: 'Scofield Reference Bible notes, 1917 (public domain).', rows: scofield })
writeJson('search-henry.json', { source: 'Matthew Henry, Exposition (1706–1721). Public domain.', rows: henry })
writeJson('search-tsk.json', { source: 'Treasury of Scripture Knowledge (ca. 1880). Public domain.', rows: tsk })
