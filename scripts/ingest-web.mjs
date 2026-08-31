/**
 * Download eBible.org WEB USFM and emit compact JSON for the app.
 * Divine name Yahweh is rendered LORD in the output (do not call this WEB).
 */
import { execFileSync } from 'node:child_process'
import { createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { get } from 'node:https'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tmp = join(root, 'tmp-web')
const usfmDir = join(tmp, 'usfm')
const zipPath = join(tmp, 'web.zip')
const outPath = join(root, 'src', 'data', 'web.json')
const sourceUrl = 'https://ebible.org/Scriptures/eng-web_usfm.zip'

const CANON = [
  ['GEN', 'Genesis', 'genesis'],
  ['EXO', 'Exodus', 'exodus'],
  ['LEV', 'Leviticus', 'leviticus'],
  ['NUM', 'Numbers', 'numbers'],
  ['DEU', 'Deuteronomy', 'deuteronomy'],
  ['JOS', 'Joshua', 'joshua'],
  ['JDG', 'Judges', 'judges'],
  ['RUT', 'Ruth', 'ruth'],
  ['1SA', '1 Samuel', '1-samuel'],
  ['2SA', '2 Samuel', '2-samuel'],
  ['1KI', '1 Kings', '1-kings'],
  ['2KI', '2 Kings', '2-kings'],
  ['1CH', '1 Chronicles', '1-chronicles'],
  ['2CH', '2 Chronicles', '2-chronicles'],
  ['EZR', 'Ezra', 'ezra'],
  ['NEH', 'Nehemiah', 'nehemiah'],
  ['EST', 'Esther', 'esther'],
  ['JOB', 'Job', 'job'],
  ['PSA', 'Psalms', 'psalms'],
  ['PRO', 'Proverbs', 'proverbs'],
  ['ECC', 'Ecclesiastes', 'ecclesiastes'],
  ['SNG', 'Song of Solomon', 'song-of-solomon'],
  ['ISA', 'Isaiah', 'isaiah'],
  ['JER', 'Jeremiah', 'jeremiah'],
  ['LAM', 'Lamentations', 'lamentations'],
  ['EZK', 'Ezekiel', 'ezekiel'],
  ['DAN', 'Daniel', 'daniel'],
  ['HOS', 'Hosea', 'hosea'],
  ['JOL', 'Joel', 'joel'],
  ['AMO', 'Amos', 'amos'],
  ['OBA', 'Obadiah', 'obadiah'],
  ['JON', 'Jonah', 'jonah'],
  ['MIC', 'Micah', 'micah'],
  ['NAM', 'Nahum', 'nahum'],
  ['HAB', 'Habakkuk', 'habakkuk'],
  ['ZEP', 'Zephaniah', 'zephaniah'],
  ['HAG', 'Haggai', 'haggai'],
  ['ZEC', 'Zechariah', 'zechariah'],
  ['MAL', 'Malachi', 'malachi'],
  ['MAT', 'Matthew', 'matthew'],
  ['MRK', 'Mark', 'mark'],
  ['LUK', 'Luke', 'luke'],
  ['JHN', 'John', 'john'],
  ['ACT', 'Acts', 'acts'],
  ['ROM', 'Romans', 'romans'],
  ['1CO', '1 Corinthians', '1-corinthians'],
  ['2CO', '2 Corinthians', '2-corinthians'],
  ['GAL', 'Galatians', 'galatians'],
  ['EPH', 'Ephesians', 'ephesians'],
  ['PHP', 'Philippians', 'philippians'],
  ['COL', 'Colossians', 'colossians'],
  ['1TH', '1 Thessalonians', '1-thessalonians'],
  ['2TH', '2 Thessalonians', '2-thessalonians'],
  ['1TI', '1 Timothy', '1-timothy'],
  ['2TI', '2 Timothy', '2-timothy'],
  ['TIT', 'Titus', 'titus'],
  ['PHM', 'Philemon', 'philemon'],
  ['HEB', 'Hebrews', 'hebrews'],
  ['JAS', 'James', 'james'],
  ['1PE', '1 Peter', '1-peter'],
  ['2PE', '2 Peter', '2-peter'],
  ['1JN', '1 John', '1-john'],
  ['2JN', '2 John', '2-john'],
  ['3JN', '3 John', '3-john'],
  ['JUD', 'Jude', 'jude'],
  ['REV', 'Revelation', 'revelation'],
]

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest)
    get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close()
        download(res.headers.location, dest).then(resolve, reject)
        return
      }
      if (res.statusCode !== 200) {
        reject(new Error(`GET ${url} -> ${res.statusCode}`))
        return
      }
      res.pipe(file)
      file.on('finish', () => file.close(resolve))
    }).on('error', reject)
  })
}

function cleanVerse(raw) {
  let s = raw
  s = s.replace(/\\f\s[\s\S]*?\\f\*/g, '')
  s = s.replace(/\\x\s[\s\S]*?\\x\*/g, '')
  s = s.replace(/\\fig[\s\S]*?\\fig\*/g, '')
  s = s.replace(/\\\+?w ([^\\|]+)\|[^\\]*\\\+?w\*/g, '$1')
  s = s.replace(/\\\+?w ([^\\]+?)\\\+?w\*/g, '$1')
  s = s.replace(/\\qs\*?\s?([^\\]*)\\qs\*/g, '$1')
  s = s.replace(/\\\+?wj\*?/g, '')
  s = s.replace(
    /\\(add|nd|bk|k|tl|it|bd|sc|qt|sig|sls|ord|dc|em)\*?\s?([^\\]*)\\\1\*/g,
    '$2',
  )
  s = s.replace(/\\\+?[a-z]+\d*\*?/gi, ' ')
  s = s.replace(/\|strong="[^"]*"/g, '')
  s = s.replace(/\s+/g, ' ').trim()
  s = s.replace(/Yahweh/g, 'LORD')
  return s
}

function parseBook(text) {
  const chapters = []
  const chunks = text.split(/^\\c\s+/m).slice(1)
  for (const chunk of chunks) {
    const nl = chunk.indexOf('\n')
    const chapter = Number.parseInt(nl === -1 ? chunk : chunk.slice(0, nl), 10)
    if (!Number.isFinite(chapter) || chapter < 1) continue
    const body = nl === -1 ? '' : chunk.slice(nl + 1)
    const hits = [...body.matchAll(/\\v\s+(\d+)\b/g)]
    const verses = []
    for (let i = 0; i < hits.length; i++) {
      const num = Number(hits[i][1])
      const start = hits[i].index + hits[i][0].length
      const end = i + 1 < hits.length ? hits[i + 1].index : body.length
      const text = cleanVerse(body.slice(start, end))
      if (!text) continue
      while (verses.length < num) verses.push('')
      verses[num - 1] = text
    }
    while (chapters.length < chapter) chapters.push([])
    chapters[chapter - 1] = verses
  }
  return chapters
}

function idFromFilename(name) {
  const m = name.match(/^\d+-([0-9A-Z]+)eng-web\.usfm$/i)
  return m ? m[1].toUpperCase() : ''
}

async function main() {
  mkdirSync(tmp, { recursive: true })
  if (!existsSync(usfmDir) || readdirSync(usfmDir).length === 0) {
    if (!existsSync(zipPath)) {
      process.stdout.write(`Downloading ${sourceUrl}\n`)
      await download(sourceUrl, zipPath)
    }
    mkdirSync(usfmDir, { recursive: true })
    execFileSync('powershell', [
      '-NoProfile',
      '-Command',
      `Expand-Archive -Path '${zipPath}' -DestinationPath '${usfmDir}' -Force`,
    ])
  }

  const files = readdirSync(usfmDir).filter((f) => f.endsWith('.usfm'))
  const byId = new Map()
  for (const file of files) {
    const id = idFromFilename(file)
    if (id) byId.set(id, join(usfmDir, file))
  }

  const books = []
  let verses = 0
  let yahwehLeft = 0
  for (const [id, name, slug] of CANON) {
    const file = byId.get(id)
    if (!file) throw new Error(`Missing USFM for ${id}`)
    const chapters = parseBook(readFileSync(file, 'utf8'))
    const count = chapters.reduce((n, ch) => n + ch.filter(Boolean).length, 0)
    verses += count
    const blob = JSON.stringify(chapters)
    const left = blob.match(/Yahweh/g)
    if (left) yahwehLeft += left.length
    if (blob.includes('|strong=') || blob.includes('\\w')) {
      throw new Error(`USFM leak in ${slug}`)
    }
    books.push({ name, slug, chapters })
  }

  if (yahwehLeft) throw new Error(`Yahweh still present in ${yahwehLeft} places`)

  const payload = {
    source: 'eBible.org eng-web USFM (public domain). Divine name rendered LORD.',
    books,
  }
  writeFileSync(outPath, JSON.stringify(payload))
  process.stdout.write(`Wrote ${outPath}\n${books.length} books, ${verses} verses\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
