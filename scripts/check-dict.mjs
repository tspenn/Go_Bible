import easton from '../src/data/easton.json' with { type: 'json' }
import web from '../src/data/web.json' with { type: 'json' }

const SENSITIVE = new Map()
const ANY = new Map()
for (const entry of easton) {
  const sensitive = new Set(entry.sensitive ?? [])
  const add = (text) => {
    if (sensitive.has(text)) SENSITIVE.set(text, entry)
    else {
      const key = text.toLowerCase()
      if (!ANY.has(key)) ANY.set(key, entry)
    }
  }
  add(entry.name)
  for (const a of entry.aliases) add(a)
}

function peel(token) {
  return token.replace(/['’]s?$/u, '')
}

function resolve(phrase) {
  const peeled = peel(phrase)
  const sensitive = SENSITIVE.get(peeled) ?? SENSITIVE.get(phrase)
  if (sensitive) return sensitive
  const entry = ANY.get(peeled.toLowerCase()) ?? ANY.get(phrase.toLowerCase())
  if (!entry) return undefined
  if (entry.topic || /\s/.test(phrase)) return entry
  if (!/^\p{Lu}/u.test(phrase)) return undefined
  return entry
}

function spans(text) {
  const tokens = []
  const re = /\p{L}[\p{L}’']*/gu
  for (const m of text.matchAll(re)) tokens.push({ t: m[0], start: m.index, end: m.index + m[0].length })
  const found = []
  const taken = Array(tokens.length).fill(false)
  for (let i = 0; i < tokens.length; i++) {
    if (taken[i]) continue
    for (let n = Math.min(4, tokens.length - i); n >= 1; n--) {
      const slice = tokens.slice(i, i + n)
      const phrase = slice.map((s) => s.t).join(' ')
      const entry = resolve(phrase)
      if (!entry) continue
      found.push({ matched: text.slice(slice[0].start, slice[n - 1].end), name: entry.name, slug: entry.slug })
      for (let k = 0; k < n; k++) taken[i + k] = true
      break
    }
  }
  return found
}

function verse(slug, c, v) {
  return web.books.find((b) => b.slug === slug).chapters[c - 1][v - 1]
}

function show(label, slug, c, v) {
  const t = verse(slug, c, v)
  const hits = spans(t)
  console.log(`\n${label}`)
  console.log(t)
  console.log(hits.map((h) => `${h.matched} → ${h.name} (${h.slug})`).join(' | ') || '(none)')
}

show('John 3:1', 'john', 3, 1)
show('John 3:5', 'john', 3, 5)
show('John 3:6', 'john', 3, 6)
show('John 3:23', 'john', 3, 23)
show('John 1:1', 'john', 1, 1)
show('John 1:29', 'john', 1, 29)
show('John 1:41', 'john', 1, 41)
show('John 1:42', 'john', 1, 42)
show('John 1:47', 'john', 1, 47)
show('John 14:16', 'john', 14, 16)
show('John 14:26', 'john', 14, 26)
show('Rom 10:17', 'romans', 10, 17)
show('Matt 11:28', 'matthew', 11, 28)
show('Isa 9:6', 'isaiah', 9, 6)
show('Gen 14:18', 'genesis', 14, 18)
show('1 Pet 5:12-13', '1-peter', 5, 12)
show('1 Pet 5:13', '1-peter', 5, 13)
show('John 3:22', 'john', 3, 22)
show('John 3:26', 'john', 3, 26)
show('Heb 11:4', 'hebrews', 11, 4)
show('Matt 11:21', 'matthew', 11, 21)
