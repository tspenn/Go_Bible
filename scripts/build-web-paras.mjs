/**
 * Build paragraph-start verse lists from eBible WEB USFM (\p, \q).
 * Does not rewrite verse wording in web.json.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const usfmDir = join(root, 'tmp-web', 'usfm')
const outPath = join(root, 'src', 'data', 'web-paras.json')

const CANON = [
  ['GEN', 'genesis'],
  ['EXO', 'exodus'],
  ['LEV', 'leviticus'],
  ['NUM', 'numbers'],
  ['DEU', 'deuteronomy'],
  ['JOS', 'joshua'],
  ['JDG', 'judges'],
  ['RUT', 'ruth'],
  ['1SA', '1-samuel'],
  ['2SA', '2-samuel'],
  ['1KI', '1-kings'],
  ['2KI', '2-kings'],
  ['1CH', '1-chronicles'],
  ['2CH', '2-chronicles'],
  ['EZR', 'ezra'],
  ['NEH', 'nehemiah'],
  ['EST', 'esther'],
  ['JOB', 'job'],
  ['PSA', 'psalms'],
  ['PRO', 'proverbs'],
  ['ECC', 'ecclesiastes'],
  ['SNG', 'song-of-solomon'],
  ['ISA', 'isaiah'],
  ['JER', 'jeremiah'],
  ['LAM', 'lamentations'],
  ['EZK', 'ezekiel'],
  ['DAN', 'daniel'],
  ['HOS', 'hosea'],
  ['JOL', 'joel'],
  ['AMO', 'amos'],
  ['OBA', 'obadiah'],
  ['JON', 'jonah'],
  ['MIC', 'micah'],
  ['NAM', 'nahum'],
  ['HAB', 'habakkuk'],
  ['ZEP', 'zephaniah'],
  ['HAG', 'haggai'],
  ['ZEC', 'zechariah'],
  ['MAL', 'malachi'],
  ['MAT', 'matthew'],
  ['MRK', 'mark'],
  ['LUK', 'luke'],
  ['JHN', 'john'],
  ['ACT', 'acts'],
  ['ROM', 'romans'],
  ['1CO', '1-corinthians'],
  ['2CO', '2-corinthians'],
  ['GAL', 'galatians'],
  ['EPH', 'ephesians'],
  ['PHP', 'philippians'],
  ['COL', 'colossians'],
  ['1TH', '1-thessalonians'],
  ['2TH', '2-thessalonians'],
  ['1TI', '1-timothy'],
  ['2TI', '2-timothy'],
  ['TIT', 'titus'],
  ['PHM', 'philemon'],
  ['HEB', 'hebrews'],
  ['JAS', 'james'],
  ['1PE', '1-peter'],
  ['2PE', '2-peter'],
  ['1JN', '1-john'],
  ['2JN', '2-john'],
  ['3JN', '3-john'],
  ['JUD', 'jude'],
  ['REV', 'revelation'],
]

const BREAK = /\\(p|pi\d*|b|pc|pr|cls|q\d*|li\d*)\b/g
const VERSE = /\\v\s+(\d+)\b/g

export function paraStartsForBook(usfm) {
  const chapters = []
  const chunks = usfm.split(/^\\c\s+/m).slice(1)
  for (const chunk of chunks) {
    const nl = chunk.indexOf('\n')
    const chapter = Number.parseInt(nl === -1 ? chunk : chunk.slice(0, nl), 10)
    if (!Number.isFinite(chapter) || chapter < 1) continue
    const body = nl === -1 ? '' : chunk.slice(nl + 1)
    const starts = []
    let pending = true
    const tokens = []
    const combined = new RegExp(`${BREAK.source}|${VERSE.source}`, 'g')
    for (const m of body.matchAll(combined)) {
      if (m[2]) {
        const n = Number(m[2])
        if (!Number.isFinite(n) || n < 1) continue
        if (pending || starts.length === 0) {
          if (!starts.includes(n)) starts.push(n)
        }
        pending = false
      } else {
        pending = true
      }
    }
    if (starts.length === 0) starts.push(1)
    while (chapters.length < chapter) chapters.push([1])
    chapters[chapter - 1] = starts
  }
  return chapters
}

function idFromFilename(name) {
  const m = name.match(/^\d+-([0-9A-Z]+)eng-web\.usfm$/i)
  return m ? m[1].toUpperCase() : ''
}

function main() {
  if (!existsSync(usfmDir)) {
    throw new Error('Missing tmp-web/usfm. Run scripts/ingest-web.mjs first.')
  }
  const files = readdirSync(usfmDir).filter((f) => f.endsWith('.usfm'))
  const byId = new Map()
  for (const file of files) {
    const id = idFromFilename(file)
    if (id) byId.set(id, join(usfmDir, file))
  }

  const books = {}
  for (const [id, slug] of CANON) {
    const file = byId.get(id)
    if (!file) throw new Error(`Missing USFM for ${id}`)
    books[slug] = paraStartsForBook(readFileSync(file, 'utf8'))
  }

  writeFileSync(
    outPath,
    JSON.stringify({
      source: 'eBible.org eng-web USFM paragraph and poetry breaks (\\p, \\q). Public domain.',
      books,
    }),
  )
  const col = books.colossians[0]
  process.stdout.write(`Wrote ${outPath}\nColossians 1 starts: ${col.join(', ')}\n`)
}

main()
