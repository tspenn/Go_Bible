import easton from '../src/data/easton.json' with { type: 'json' }
import web from '../src/data/web.json' with { type: 'json' }

/** Chapters that already have Scofield, Henry, or Robertson seed notes. */
export const SEED_CHAPTERS = [
  ['genesis', 1],
  ['psalms', 23],
  ['proverbs', 3],
  ['matthew', 5],
  ['matthew', 11],
  ['luke', 15],
  ['john', 1],
  ['john', 3],
  ['john', 14],
  ['acts', 2],
  ['romans', 8],
  ['romans', 10],
  ['2-corinthians', 5],
  ['hebrews', 11],
  ['1-peter', 5],
]

const SKIP = new Set(
  `
  a an the and but or nor for so yet as if then than when while where why how
  who whom whose what which that this these those there here thus also too not
  no yes yea nay lo behold both either neither each every any some all most many
  few more less such other another same own very just even only still
  about above after again against along among around before behind below beneath
  beside besides between beyond during except inside into onto over through
  throughout toward towards under underneath until upon within without from
  unto of to in on by at with into onto upon
  i me my mine we our ours you your yours he him his she her hers it its they
  them their theirs am is are was were be been being have has had do does did
  doing will would shall should may might must can could
  let come go came went see saw say said make made give gave take took know
  knew call called send sent hear heard tell told bring brought put set keep
  kept find found look looked ask asked begin began live lived die died
  god jesus christ lord jehovah yahweh father son holy amen alpha omega blessed
  whoever whatever wherever however therefore because according concerning
  now out please arise leave return everything afterward increase one high walk
  pairs ben isn't don't almighty prince everlasting mighty wonderful
  so most certainly unless can't enter kingdom that which also because there
  they came were baptized after these things stayed them himself something
  greater receives testimony spoken words true none has seen believed
  already condemned light darkness everyone practices expose
  `.trim().split(/\s+/),
)

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
  for (const m of text.matchAll(re)) {
    tokens.push({ t: m[0], start: m.index, end: m.index + m[0].length })
  }
  const found = []
  const taken = Array(tokens.length).fill(false)
  const misses = []
  for (let i = 0; i < tokens.length; i++) {
    if (taken[i]) continue
    let hit = null
    for (let n = Math.min(4, tokens.length - i); n >= 1; n--) {
      const slice = tokens.slice(i, i + n)
      const phrase = slice.map((s) => s.t).join(' ')
      const entry = resolve(phrase)
      if (!entry) continue
      const start = slice[0].start
      if (entry.slug === 'rest') {
        const before = text.slice(Math.max(0, start - 5), start).toLowerCase()
        if (/\bthe\s*$/.test(before)) continue
      }
      hit = { matched: text.slice(start, slice[n - 1].end), name: entry.name, slug: entry.slug }
      for (let k = 0; k < n; k++) taken[i + k] = true
      break
    }
    if (hit) found.push(hit)
    else {
      const word = tokens[i].t
      const key = peel(word).toLowerCase()
      if (/^\p{Lu}/u.test(word) && !SKIP.has(key) && key.length > 2) misses.push(word)
    }
  }
  return { found, misses }
}

const book = (slug) => web.books.find((b) => b.slug === slug)

for (const [slug, ch] of SEED_CHAPTERS) {
  const verses = book(slug).chapters[ch - 1]
  const names = new Map()
  const miss = new Map()
  verses.forEach((t, i) => {
    const { found, misses } = spans(t)
    for (const h of found) {
      if (!names.has(h.slug)) names.set(h.slug, { name: h.name, at: [] })
      const row = names.get(h.slug)
      if (row.at.length < 4) row.at.push(`${ch}:${i + 1} “${h.matched}”`)
    }
    for (const m of misses) {
      const k = peel(m).toLowerCase()
      if (!miss.has(k)) miss.set(k, `${ch}:${i + 1} ${m}`)
    }
  })
  console.log(`\n=== ${slug} ${ch} (${verses.length} verses) ===`)
  console.log(
    [...names.values()]
      .map((r) => `${r.name}  ${r.at[0]}`)
      .sort((a, b) => a.localeCompare(b))
      .join('\n') || '(no names)',
  )
  if (miss.size) {
    console.log('UNMATCHED:', [...miss.entries()].map(([k, loc]) => `${k} (${loc})`).join('; '))
  }
}
