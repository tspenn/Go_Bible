/**
 * Matthew Henry, Exposition of the Old and New Testament (complete commentary).
 * Public domain. OT volumes 1706–1710; NT completed from his papers after 1714 (through 1721).
 *
 * Seed notes in this file are kept as-is. Full Exposition groups are added from
 * henry-books/ without replacing seed wording. Never MHCC Concise.
 */
import { useSyncExternalStore } from 'react'
import { findVerse } from './kjv'
import { phraseSpan } from './scofield'

export type HenryNote = {
  bookSlug: string
  chapter: number
  verse: number
  /** Verse grouping in the complete commentary, when not a single verse. */
  range?: string
  body: string
  /** Exact words in the displayed verse, only if they already sit in Henry’s comment. */
  webPhrase?: string
}

export const HENRY_SOURCE =
  'Matthew Henry, Exposition of the Old and New Testament (1706–1721). Public domain.'

type HenryStore = Record<string, Record<string, Record<string, HenryNote>>>

function note(n: HenryNote): HenryNote {
  return n
}

const HENRY: HenryStore = {
  genesis: {
    '1': {
      '1': note({
        bookSlug: 'genesis',
        chapter: 1,
        verse: 1,
        range: '1-2',
        body: 'In these verses we have the work of creation in its epitome and in its embryo. I. In its epitome, v. 1, where we find, to our comfort, the first article of our creed, that God the Father Almighty is the Maker of heaven and earth, and as such we believe in him. Observe, in this verse, four things:— (1.) The effect produced—the heaven and the earth, that is, the world, including the whole frame and furniture of the universe. (2.) The author and cause of this great work—GOD. The Hebrew word is Elohim, which bespeaks the power of God the Creator, and the plurality of persons in the Godhead, Father, Son, and Holy Ghost. (3.) The manner in which this work was effected: God created it, that is, made it out of nothing. There was not any pre-existent matter out of which the world was produced. (4.) When this work was produced: In the beginning, that is, in the beginning of time. Before the beginning of time there was none but that Infinite Being that inhabits eternity. Let us learn hence, That atheism is folly; that God is sovereign Lord of all by an incontestable right; that with God all things are possible; and that the God we serve is worthy of, and yet is exalted far above, all blessing and praise.',
      }),
    },
  },
  john: {
    '1': {
      '1': note({
        bookSlug: 'john',
        chapter: 1,
        verse: 1,
        range: '1-5',
        body: 'The evangelist here lays down the great truth he is to prove, that Jesus Christ is God, one with the Father. Observe, I. Of whom he speaks—The Word, that is, Jesus Christ, who, as the Word, speaks from God to us, and speaks to God for us. II. What he saith of him. 1. That he was in the beginning: In the beginning was the Word. This bespeaks his existence, not only before his incarnation, but before all time. 2. That he was with God: the Word was with God. He was with the Father from everlasting, as a Son brought up with him. 3. That he was God: and the Word was God. He participated in the Godhead, as truly and as fully as the Father. This proves that he is not a creature, but the Creator, for he was with God in the beginning.',
      }),
    },
    '3': {
      '16': note({
        bookSlug: 'john',
        chapter: 3,
        verse: 16,
        range: '1-21',
        body: 'Here is the great gospel mystery of Christ’s coming into the world to save it. God so loved the world that he gave his only-begotten Son. The love of God the Father is the original of our regeneration by the Spirit and our reconciliation by the lifting up of the Son. Behold, and wonder, that the great God should love such a worthless world! That he gave his Son, such a Son, his only-begotten Son, and this for us, and to us. That whosoever believes in him, of what nation, or rank, or condition soever they be, should not perish, but have everlasting life. This is the gospel in little, and yet the height and depth of gospel grace. The love is God’s; the gift is his Son; the terms are believing; the alternative is perishing or everlasting life.',
      }),
    },
    '14': {
      '6': note({
        bookSlug: 'john',
        chapter: 14,
        verse: 6,
        range: '4-11',
        body: 'Christ himself is their way: I am the way, the truth, and the life. 1. I am the way. Christ is the way: he is the high priest, by whom we may now enter into the holiest. We cannot go to the Father but by him. 2. I am the truth. He is the true way; there are many false ways, but Christ is the true one. He is truth itself. 3. I am the life. He is the living way; all other ways lead to death. He is life to all the true saints. No man comes unto the Father but by me. All that come to God as a Father must come by this new and living way. There is no coming to heaven as our home but by Jesus Christ as our way.',
      }),
    },
  },
  romans: {
    '8': {
      '28': note({
        bookSlug: 'romans',
        chapter: 8,
        verse: 28,
        range: '28-31',
        body: 'The apostle speaks of this with the greatest assurance: We know. It is not a mere conjecture, but a matter of knowledge. All things work together for good to them that love God. They work, they work together, they work together for good. The sufferings of this present time, and all the events of providence, even those that seem most contrary, are so ordered and over-ruled as to work together for the spiritual and eternal good of those that love God, and are the called according to his purpose. This is a privilege of the saints, and a great support under affliction: if God be for us, if all things work for us, who can be against us?',
      }),
    },
    '10': {
      '17': note({
        bookSlug: 'romans',
        chapter: 10,
        verse: 17,
        range: '14-21',
        body: 'Faith comes by hearing, and hearing by the word of God. The beginning, progress, and strength of faith, are by hearing. But it is hearing the word of God. It is not hearing the word of man, or the traditions of the elders, but the word of God, that is the ordinary means of faith. How shall they believe in him of whom they have not heard? And how shall they hear without a preacher? The word is the vehicle of the Spirit; and faith, which is the work of the Spirit, comes by that hearing. Let us then prize the word, and attend upon it, that faith may come, and grow.',
      }),
    },
  },
  '2-corinthians': {
    '5': {
      '7': note({
        bookSlug: '2-corinthians',
        chapter: 5,
        verse: 7,
        range: '1-11',
        body: 'The apostle deduces an inference for the comfort of believers in their present state, v. 6–8. What their present state or condition is: they are absent from the Lord (v. 6); they are pilgrims and strangers in this world; they do but sojourn here in their earthly home, or in this tabernacle; and though God is with us here, by his Spirit, and in his ordinances, yet we are not with him as we hope to be: we cannot see his face while we live: For we walk by faith, not by sight, v. 7. We have not the vision and fruition of God, as of an object that is present with us, and as we hope for hereafter, when we shall see as we are seen. Note, Faith is for this world, and sight is reserved for the other world: and it is our duty, and will be our interest, to walk by faith, till we come to live by sight.',
      }),
    },
  },
  hebrews: {
    '11': {
      '1': note({
        bookSlug: 'hebrews',
        chapter: 11,
        verse: 1,
        range: '1-3',
        body: 'Here we have a definition or description of the grace of faith in two parts. 1. It is the substance of things hoped for. Faith and hope go together; and the same things that are the object of our hope are the object of our faith. It is a firm persuasion and expectation that God will perform all that he has promised to us in this world and in the other; it is the substance, the subsistence, of things hoped for. 2. It is the evidence of things not seen. Faith demonstrates to the eye of the mind the reality of those things which cannot be discerned by the eye of the body. It is a well-grounded assurance of that for which we have sufficient evidence, the testimony of God who cannot lie.',
      }),
      '6': note({
        bookSlug: 'hebrews',
        chapter: 11,
        verse: 6,
        range: '4-7',
        body: 'But without faith it is impossible to please him. This is added to show that Enoch pleased God by faith. Two things are necessary in our worship of God, which we must firmly believe: that he is, and that he is a rewarder of them that diligently seek him. We must believe God’s being, that he is; and we must believe his bounty, that he is a rewarder. Those who would find God must seek him diligently; and those who seek him so shall not seek in vain. Faith must rest on both: that there is a God, and that he is good to those who come to him.',
      }),
    },
  },
  proverbs: {
    '3': {
      '5': note({
        bookSlug: 'proverbs',
        chapter: 3,
        verse: 5,
        range: '5-6',
        body: 'We must live a life of dependence upon God, because that is the way to be safe (v. 5). Trust in the Lord with all thy heart. We must believe that he is able to do what he will, wise to do what is best, and good, according to his promise, to do what is best for us, if we love him and serve him. We must not lean to our own understanding, as if we could, of ourselves, without divine conduct and strength, think or do that which is wise and good. Those that lean to their own understanding, and think to shift for themselves without God, are not only fools, but will find themselves disappointed. In all thy ways acknowledge him; and he shall direct thy paths.',
      }),
    },
  },
  matthew: {
    '11': {
      '28': note({
        bookSlug: 'matthew',
        chapter: 11,
        verse: 28,
        range: '25-30',
        body: 'His gracious call and invitation of poor sinners to come to him, and to be ruled, and taught, and saved by him (v. 27-30). Come unto me, all ye that labour and are heavy laden, and I will give you rest. The character of the persons invited: those that labour and are heavy laden, weary of the world, and of sin, and of their own righteousness, and willing to be made whole. The invitation: Come unto me. The promise: I will give you rest—rest from the terror of the law, rest from the power of sin, rest for the soul. Two rests are here: the rest of pardon and peace, given to those that come; and the rest of obedience, found in taking his yoke and learning of him, for he is meek and lowly in heart.',
      }),
    },
  },
  '1-peter': {
    '5': {
      '7': note({
        bookSlug: '1-peter',
        chapter: 5,
        verse: 7,
        range: '5-7',
        body: 'His advice is to cast all their care, or all care of themselves, upon God. “Throw your cares, which are so cutting and distracting, which wound your souls and pierce your hearts, upon the wise and gracious providence of God; trust in him with a firm composed mind, for he careth for you. He is willing to release you of your care, and take the care of you upon himself. He will either avert what you fear, or support you under it.” Learn, 1. The best of Christians are apt to labour under the burden of anxious and excessive care. 2. The cares even of good people are very burdensome, and too often very sinful, when they arise from unbelief and diffidence. 3. The best remedy against immoderate care is to cast our care upon God, and resign every event to the wise and gracious determination.',
      }),
    },
  },
}

const SKIP = new Set([
  'the',
  'and',
  'of',
  'to',
  'in',
  'that',
  'for',
  'was',
  'were',
  'with',
  'from',
  'this',
  'they',
  'them',
  'his',
  'her',
  'you',
  'your',
  'our',
  'not',
  'but',
  'all',
  'are',
  'had',
  'has',
  'have',
  'him',
  'who',
  'which',
  'unto',
  'shall',
  'will',
  'god',
  'lord',
  'jesus',
  'christ',
])

export function coversVerse(n: HenryNote, verse: number) {
  if (n.range === 'intro') return n.verse === verse
  if (n.verse === verse) return true
  if (!n.range) return false
  const m = n.range.match(/^(\d+)\s*[-–]\s*(\d+)$/)
  if (!m) return n.range === String(verse)
  return verse >= Number(m[1]) && verse <= Number(m[2])
}

function seedList(): HenryNote[] {
  const out: HenryNote[] = []
  for (const book of Object.values(HENRY)) {
    for (const ch of Object.values(book)) {
      out.push(...Object.values(ch))
    }
  }
  return out
}

const SEED_NOTES = seedList()

type Payload = { source: string; notes: HenryNote[] }

const bookLoaders = import.meta.glob('./henry-books/*.json') as Record<
  string,
  () => Promise<{ default: Payload } | Payload>
>

const extra = new Map<string, HenryNote[]>()
const loadedBooks = new Set<string>()
const loading = new Map<string, Promise<void>>()
const listeners = new Set<() => void>()
let version = 0

function bookChapterKey(bookSlug: string, chapter: number) {
  return `${bookSlug}:${chapter}`
}

function addNotes(notes: HenryNote[]) {
  for (const n of notes) {
    const key = bookChapterKey(n.bookSlug, n.chapter)
    const list = extra.get(key) ?? []
    list.push(n)
    extra.set(key, list)
  }
  version += 1
  listeners.forEach((fn) => fn())
}

export function subscribeHenry(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function henryStoreVersion() {
  return version
}

export async function ensureHenryBook(bookSlug: string) {
  if (loadedBooks.has(bookSlug)) return
  const path = `./henry-books/${bookSlug}.json`
  const loader = bookLoaders[path]
  if (!loader) {
    loadedBooks.add(bookSlug)
    return
  }
  const pending = loading.get(bookSlug)
  if (pending) return pending
  const work = loader()
    .then((mod) => {
      const payload = (mod as { default?: Payload }).default ?? (mod as Payload)
      addNotes(payload.notes ?? [])
      loadedBooks.add(bookSlug)
    })
    .catch((err) => {
      console.warn(`Henry book ${bookSlug} failed to load`, err)
    })
    .finally(() => {
      loading.delete(bookSlug)
    })
  loading.set(bookSlug, work)
  return work
}

export function useHenry() {
  return useSyncExternalStore(subscribeHenry, henryStoreVersion, () => 0)
}

export function henryPhraseInVerse(text: string, body: string) {
  if (!text || !body) return ''
  const tokens: { start: number; end: number; t: string }[] = []
  const re = /\p{L}[\p{L}’']*/gu
  for (const m of text.matchAll(re)) {
    if (m.index == null) continue
    tokens.push({ t: m[0], start: m.index, end: m.index + m[0].length })
  }
  for (let n = Math.min(4, tokens.length); n >= 2; n--) {
    for (let i = 0; i <= tokens.length - n; i++) {
      const slice = tokens.slice(i, i + n)
      if (slice.every((s) => SKIP.has(s.t.toLowerCase()))) continue
      if (!slice.some((s) => s.t.length >= 5 && !SKIP.has(s.t.toLowerCase()))) continue
      const phrase = text.slice(slice[0].start, slice[n - 1].end)
      if (phrase.length < 7) continue
      if (phraseSpan(body, phrase)) return phrase
    }
  }
  return ''
}

export function henryNotesForVerse(bookSlug: string, chapter: number, verse: number) {
  const seed = SEED_NOTES.filter(
    (n) => n.bookSlug === bookSlug && n.chapter === chapter && coversVerse(n, verse),
  )
  const dump = (extra.get(bookChapterKey(bookSlug, chapter)) ?? []).filter((n) => coversVerse(n, verse))
  const intros = dump.filter((n) => n.range === 'intro')
  const groups = dump.filter((n) => n.range !== 'intro')
  return [...intros, ...seed, ...groups]
}

export function henryForVerse(bookSlug: string, chapter: number, verse: number) {
  return henryNotesForVerse(bookSlug, chapter, verse)[0]
}

export function henryForChapter(bookSlug: string, chapter: number) {
  const verses = new Set<number>()
  for (const n of henryNotesForVerse(bookSlug, chapter, 1)) {
    if (n.chapter === chapter) verses.add(n.verse)
  }
  const dump = extra.get(bookChapterKey(bookSlug, chapter)) ?? []
  for (const n of dump) verses.add(n.verse)
  for (const n of SEED_NOTES) {
    if (n.bookSlug === bookSlug && n.chapter === chapter) verses.add(n.verse)
  }
  const seen = new Set<string>()
  const out: HenryNote[] = []
  for (const v of [...verses].sort((a, b) => a - b)) {
    for (const n of henryNotesForVerse(bookSlug, chapter, v)) {
      const id = `${n.range ?? n.verse}:${n.verse}:${n.body.slice(0, 24)}`
      if (seen.has(id)) continue
      seen.add(id)
      out.push(n)
    }
  }
  return out
}

export function henryLinkPhrase(note: HenryNote, verseText: string) {
  if (note.webPhrase && phraseSpan(verseText, note.webPhrase)) return note.webPhrase
  return henryPhraseInVerse(verseText, note.body)
}

export function attachHenryPhrase(bookSlug: string, chapter: number, verse: number) {
  const v = findVerse(bookSlug, chapter, verse)
  if (!v) return ''
  for (const n of henryNotesForVerse(bookSlug, chapter, verse)) {
    if (n.range === 'intro') continue
    const phrase = henryLinkPhrase(n, v.text)
    if (phrase) return phrase
  }
  return ''
}
