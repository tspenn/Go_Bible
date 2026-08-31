import { findVerse, isKnownBook, resolveBookSlug } from './kjv'

export type DictEntry = {
  slug: string
  name: string
  aliases: string[]
  body: string
  source: 'Easton' | 'Smith'
}

/** Public-domain dictionary seeds (Easton 1897 / Smith). No Vine, Wuest, Unger, or modern works. */
export const DICTIONARY: DictEntry[] = [
  {
    slug: 'faith',
    name: 'Faith',
    aliases: [],
    source: 'Easton',
    body: 'Faith is in general the persuasion of the mind that a certain statement is true. Its primary idea is trust. In the New Testament it is trust in Christ as the Saviour.',
  },
  {
    slug: 'grace',
    name: 'Grace',
    aliases: [],
    source: 'Easton',
    body: 'Grace is the free unmerited love and favor of God. Saving grace is the work of the Spirit in calling, renewing, and keeping the believer.',
  },
  {
    slug: 'prayer',
    name: 'Prayer',
    aliases: [],
    source: 'Easton',
    body: 'Prayer is converse with God. It includes adoration, confession, thanksgiving, and petition.',
  },
  {
    slug: 'hope',
    name: 'Hope',
    aliases: [],
    source: 'Easton',
    body: 'Hope is an expectation of future good. In Scripture it is the confident waiting for what God has promised.',
  },
  {
    slug: 'shepherd',
    name: 'Shepherd',
    aliases: [],
    source: 'Easton',
    body: 'A frequent figure for the care of God and of Christ over His people. "The Lord is my shepherd."',
  },
  {
    slug: 'word',
    name: 'Word',
    aliases: ['the Word'],
    source: 'Easton',
    body: 'Used of the revelation of God, and as a title of Christ: "the Word was God."',
  },
  {
    slug: 'rest',
    name: 'Rest',
    aliases: [],
    source: 'Easton',
    body: 'The Sabbath rest; also the rest Christ gives to the weary who come to Him.',
  },
  {
    slug: 'nicodemus',
    name: 'Nicodemus',
    aliases: [],
    source: 'Easton',
    body: 'The people is victor, a Pharisee and a member of the Sanhedrin. He is first noticed as visiting Jesus by night (John 3:1-21) for the purpose of learning more of his doctrines, which our Lord then unfolded to him, giving prominence to the necessity of being "born again." He is next met with in the Sanhedrin (John 7:50-52), where he protested against the course they were taking in plotting against Christ. Once more he is mentioned as taking part in the preparation for the anointing and burial of the body of Christ (John 19:39).',
  },
  {
    slug: 'pharisees',
    name: 'Pharisees',
    aliases: ['Pharisee'],
    source: 'Easton',
    body: 'Separatists (Heb. persahin, from parash, "to separate"). They were probably the successors of the Assideans (i.e., the "pious"). In the time of our Lord they were the popular party. They were extremely accurate and minute in all matters appertaining to the law of Moses. From the very beginning of his ministry the Pharisees showed themselves bitter and persistent enemies of our Lord.',
  },
  {
    slug: 'jerusalem',
    name: 'Jerusalem',
    aliases: ['Salem'],
    source: 'Easton',
    body: 'Called also Salem, Ariel, Jebus, the "city of God," the "holy city." This name is in the original in the dual form, and means "possession of peace," or "foundation of peace." It is first mentioned in Scripture under the name Salem (Genesis 14:18). David drove out the Jebusites and fixed his dwelling on Zion, which he called "the city of David."',
  },
  {
    slug: 'judea',
    name: 'Judea',
    aliases: ['Judaea'],
    source: 'Easton',
    body: 'After the Captivity this name was applied to the whole of the country west of the Jordan (Haggai 1:1, 14; 2:2). But under the Romans, in the time of Christ, it denoted the southernmost of the three divisions of Palestine (Matthew 2:1, 5; 3:1; 4:25), although it was also sometimes used for Palestine generally (Acts 28:21).',
  },
  {
    slug: 'galilee',
    name: 'Galilee',
    aliases: [],
    source: 'Easton',
    body: 'Circuit. In later times this name was especially given to the whole region north of Samaria. In the time of our Lord there were three regions in Palestine, Judea, Samaria, and Galilee. Galilee occupied the whole northern section of the country.',
  },
  {
    slug: 'moses',
    name: 'Moses',
    aliases: [],
    source: 'Easton',
    body: 'Drawn (or Egypt. mesu, "son"). In the New Testament he is referred to as the representative of the law and as a type of Christ (John 1:17; Hebrews 3:5, 6). Moses is the only character in the Old Testament to whom Christ likens himself (John 5:46; compare Deuteronomy 18:15). "There arose not a prophet since in Israel like unto Moses, whom the Lord knew face to face."',
  },
  {
    slug: 'abraham',
    name: 'Abraham',
    aliases: ['Abram'],
    source: 'Easton',
    body: 'Father of a multitude, son of Terah, named (Genesis 11:27) before his older brothers Nahor and Haran, because he was the heir of the promises. Till the age of seventy, Abram sojourned among his kindred in his native country of Chaldea. He is called "the friend of God" (James 2:23), "faithful Abraham" (Galatians 3:9), "the father of us all" (Romans 4:16).',
  },
  {
    slug: 'israel',
    name: 'Israel',
    aliases: ['Israelites'],
    source: 'Easton',
    body: 'The name conferred on Jacob after the great prayer-struggle at Peniel (Genesis 32:28), because "as a prince he had power with God and prevailed." This is the common name given to Jacob\'s descendants. The whole people of the twelve tribes are called "Israelites," the "children of Israel," and the "house of Israel." After the Exile the name Israel was assumed as designating the entire nation.',
  },
  {
    slug: 'sabbath',
    name: 'Sabbath',
    aliases: [],
    source: 'Easton',
    body: '(Heb. shabbath, meaning "to rest from labour"), the day of rest. It is first mentioned as having been instituted in Paradise, when man was in innocence (Genesis 2:2, 3). "The sabbath was made for man," as a day of rest and refreshment for the body and of blessing to the soul.',
  },
  {
    slug: 'spirit',
    name: 'Spirit',
    aliases: ['Holy Ghost', 'Holy Spirit'],
    source: 'Easton',
    body: 'The Holy Ghost. His personality is proved from the fact that the attributes of personality, as intelligence and volition, are ascribed to him (John 14:17, 26; 15:26). He reproves, helps, glorifies, intercedes (John 16:7-13; Romans 8:26). His divinity is established from the names of God ascribed to him, and from divine attributes: omnipresence, omniscience, omnipotence, eternity. Creation is ascribed to him (Genesis 1:2), and worship is required and ascribed to him (Matthew 28:19).',
  },
  {
    slug: 'jordan',
    name: 'Jordan',
    aliases: [],
    source: 'Easton',
    body: 'The river of Palestine. It originates in the snows of Hermon, which feed its perennial fountains. From the Sea of Galilee it flows through a long, low plain called "the region of Jordan" (Matthew 3:5), down to the Dead Sea. The chief events in gospel history connected with it are John the Baptist\'s ministry, and that Jesus "was baptized of John in Jordan" (Mark 1:9).',
  },
]

export type DictSpan = {
  start: number
  end: number
  matched: string
  entry: DictEntry
}

function labelsOf(d: DictEntry) {
  return [d.name, ...d.aliases].filter(Boolean)
}

function caseSensitiveLabel(label: string) {
  return label === 'Spirit'
}

function labelRegex(label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
  const flags = caseSensitiveLabel(label) ? 'gu' : 'giu'
  return new RegExp(`(?<!\\p{L})${escaped}(?!\\p{L})`, flags)
}

export function findDict(slug: string) {
  return DICTIONARY.find((d) => d.slug === slug)
}

export function dictForWord(word: string, linked?: DictEntry[]) {
  const pool = linked && linked.length ? linked : DICTIONARY
  for (const d of pool) {
    for (const label of labelsOf(d)) {
      if (label.includes(' ')) continue
      if (caseSensitiveLabel(label)) {
        if (word === label) return d
        continue
      }
      if (label.toLowerCase() === word.toLowerCase()) return d
    }
  }
  return undefined
}

export function dictSpansInText(text: string): DictSpan[] {
  const found: DictSpan[] = []
  const needles: { label: string; entry: DictEntry }[] = []
  for (const entry of DICTIONARY) {
    for (const label of labelsOf(entry)) {
      needles.push({ label, entry })
    }
  }
  needles.sort((a, b) => b.label.length - a.label.length)

  for (const { label, entry } of needles) {
    const re = labelRegex(label)
    for (const m of text.matchAll(re)) {
      if (m.index == null) continue
      const start = m.index
      const end = start + m[0].length
      if (found.some((s) => start < s.end && end > s.start)) continue
      found.push({ start, end, matched: m[0], entry })
    }
  }
  found.sort((a, b) => a.start - b.start)
  return found
}

export function dictEntriesInText(text: string) {
  const seen = new Set<string>()
  const out: DictEntry[] = []
  for (const span of dictSpansInText(text)) {
    if (seen.has(span.entry.slug)) continue
    seen.add(span.entry.slug)
    out.push(span.entry)
  }
  return out
}

export function dictForVerse(bookSlug: string, chapter: number, verse: number) {
  const v = findVerse(bookSlug, chapter, verse)
  if (!v) return []
  return dictEntriesInText(v.text)
}

export type LinkedBit =
  | { type: 'text'; text: string }
  | { type: 'ref'; text: string; href: string }
  | { type: 'dict'; text: string; entry: DictEntry }

const BOOK_REF = /\b(?:(\d+)\s+)?([A-Za-z]+)\.?\s+(\d+):(\d+)(?:[-–](\d+))?/g
const V_REF = /\bv(?:s)?\.\s*(\d+)(?:\s*[-–]\s*(\d+))?/gi

export function bibleVerseHref(bookSlug: string, chapter: number, verse: number) {
  return `/bible/${bookSlug}/${chapter}/${verse}`
}

const NOTE_DICT_SKIP = new Set(['faith', 'grace', 'hope', 'prayer', 'rest', 'shepherd'])
export function linkBodyBits(body: string, fromBook: string, fromChapter: number): LinkedBit[] {
  type Hit = { start: number; end: number; bit: Exclude<LinkedBit, { type: 'text' }> }
  const hits: Hit[] = []
  const bookRe = new RegExp(BOOK_REF.source, 'g')
  const vRe = new RegExp(V_REF.source, 'gi')

  for (const m of body.matchAll(bookRe)) {
    const book = [m[1], m[2]].filter(Boolean).join(' ')
    if (!isKnownBook(book) || m.index == null) continue
    hits.push({
      start: m.index,
      end: m.index + m[0].length,
      bit: {
        type: 'ref',
        text: m[0],
        href: bibleVerseHref(resolveBookSlug(book), Number(m[3]), Number(m[4])),
      },
    })
  }

  for (const m of body.matchAll(vRe)) {
    if (m.index == null) continue
    hits.push({
      start: m.index,
      end: m.index + m[0].length,
      bit: {
        type: 'ref',
        text: m[0],
        href: bibleVerseHref(fromBook, fromChapter, Number(m[1])),
      },
    })
  }

  for (const span of dictSpansInText(body)) {
    if (NOTE_DICT_SKIP.has(span.entry.slug)) continue
    if (hits.some((h) => span.start < h.end && span.end > h.start)) continue
    hits.push({
      start: span.start,
      end: span.end,
      bit: { type: 'dict', text: span.matched, entry: span.entry },
    })
  }

  hits.sort((a, b) => a.start - b.start)
  const bits: LinkedBit[] = []
  let at = 0
  for (const hit of hits) {
    if (hit.start < at) continue
    if (hit.start > at) bits.push({ type: 'text', text: body.slice(at, hit.start) })
    bits.push(hit.bit)
    at = hit.end
  }
  if (at < body.length) bits.push({ type: 'text', text: body.slice(at) })
  return bits
}
