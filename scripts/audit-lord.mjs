import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { englishTheLord } from './render-yahweh.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const path = join(root, 'src', 'data', 'web.json')
const data = JSON.parse(readFileSync(path, 'utf8'))

const apply = process.argv.includes('--apply')

function countBare(text) {
  let n = 0
  for (const m of text.matchAll(/\bLORD(?:['’]s)?\b/g)) {
    const before = text.slice(Math.max(0, m.index - 8), m.index)
    if (!/(?:^|[^A-Za-z])(?:the|The|O|o|Oh|oh) $/.test(before)) n += 1
  }
  return n
}

const samples = []
let bareBefore = 0
let lordHits = 0
let theLord = 0
let oLord = 0
let lordLord = 0
let lordWord = 0

for (const book of data.books) {
  book.chapters.forEach((ch, ci) => {
    ch.forEach((text, vi) => {
      if (!text) return
      const lords = text.match(/\bLORD(?:['’]s)?\b/g)
      if (lords) lordHits += lords.length
      const thes = text.match(/\b(?:the|The) LORD(?:['’]s)?\b/g)
      if (thes) theLord += thes.length
      const os = text.match(/\b[Oo]h? LORD\b/g)
      if (os) oLord += os.length
      const combo = text.match(/\bLord LORD\b/g)
      if (combo) lordLord += combo.length
      const adonai = text.match(/\bLord\b/g)
      if (adonai) lordWord += adonai.length
      const bare = countBare(text)
      bareBefore += bare
      if (bare && samples.length < 12) {
        samples.push(`${book.slug} ${ci + 1}:${vi + 1} — ${text}`)
      }
      if (apply) ch[vi] = englishTheLord(text)
    })
  })
}

let bareAfter = 0
if (apply) {
  for (const book of data.books) {
    for (const ch of book.chapters) {
      for (const text of ch) {
        if (text) bareAfter += countBare(text)
      }
    }
  }
  data.source =
    'eBible.org eng-web USFM (public domain). Divine name Yahweh rendered the LORD.'
  writeFileSync(path, JSON.stringify(data))
}

const exo5 = data.books.find((b) => b.slug === 'exodus').chapters[4]
process.stdout.write(
  [
    `LORD tokens: ${lordHits}`,
    `already "the LORD": ${theLord}`,
    `"O/Oh LORD": ${oLord}`,
    `"Lord LORD" (Adonai+YHWH): ${lordLord}`,
    `"Lord" (Adonai, untouched): ${lordWord}`,
    `bare LORD needing "the": ${bareBefore}`,
    apply ? `bare LORD after apply: ${bareAfter}` : 'dry run (pass --apply to write)',
    '',
    'Exodus 5:17',
    exo5[16],
    '',
    'Exodus 5:21',
    exo5[20],
    '',
    'Exodus 5:22',
    exo5[21],
    '',
    'Sample bare LORD verses:',
    ...samples,
    '',
  ].join('\n'),
)
