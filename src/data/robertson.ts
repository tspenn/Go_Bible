/**
 * A. T. Robertson, Word Pictures in the New Testament.
 * Vols. 1–3 only (Matthew, Mark, Luke, Acts), 1930. Public domain.
 *
 * Do not add Romans–Revelation, John, Hebrews, or the General Epistles
 * (vols. 4–6, 1931–1933). Do not use later reprints’ extra notes or the
 * 100th-anniversary reset text.
 *
 * Seed notes in this file are kept as-is. Full 1930 notes are added from
 * robertson-books/ without replacing seed wording.
 */
import { useSyncExternalStore } from 'react'

export type RobertsonNote = {
  bookSlug: string
  chapter: number
  verse: number
  heading?: string
  body: string
  /** English word in the Go-Bible verse this letter sits on. */
  word?: string
}

export const ROBERTSON_SOURCE =
  'A. T. Robertson, Word Pictures, vols. 1–3 (1930). Public domain.'

export const ROBERTSON_BOOKS = ['matthew', 'mark', 'luke', 'acts'] as const

export function isRobertsonBook(bookSlug: string) {
  return (ROBERTSON_BOOKS as readonly string[]).includes(bookSlug)
}

export function rwpKey(n: RobertsonNote, indexInChapter: number) {
  return `rwp-${n.bookSlug}-${n.chapter}-${n.verse}-${indexInChapter}`
}

export const ROBERTSON: RobertsonNote[] = [
  {
    bookSlug: 'matthew',
    chapter: 5,
    verse: 13,
    heading: 'Lost its savour',
    word: 'salt',
    body: 'Lost its savour (moranthe). The verb is from moros (dull, sluggish, stupid, foolish) and means to play the fool, to become foolish, of salt become tasteless, insipid (Mk 9:50). It is common in Syria and Palestine to see salt scattered in piles on the ground because it has lost its flavour, "hae tint its tang" (Braid Scots), the most worthless thing imaginable. Jesus may have used here a current proverb.',
  },
  {
    bookSlug: 'matthew',
    chapter: 5,
    verse: 15,
    heading: 'Under the bushel',
    word: 'basket',
    body: 'Under the bushel (hupo ton modion). Not a bushel. "The figure is taken from lowly cottage life. There was a projecting stone in the wall on which the lamp was set. The house consisted of a single room, so that the tiny light sufficed for all" (Bruce). It was not put under the bushel (the only one in the room) save to put it out or to hide it. The bushel was an earthenware grain measure. "The stand" (ten luchnian), not "candlestick." It is "lamp-stand" in each of the twelve examples in the Bible.',
  },
  {
    bookSlug: 'matthew',
    chapter: 5,
    verse: 16,
    heading: 'Even so',
    word: 'light',
    body: 'Even so (houtos). The adverb points backward to the lamp-stand. Thus men are to let their light shine, not to glorify themselves, but "your Father in heaven." Light shines to see others by, not to call attention to itself.',
  },
  {
    bookSlug: 'matthew',
    chapter: 11,
    verse: 28,
    heading: 'Come unto me',
    word: 'Come',
    body: 'Come unto me (deute pros me). Verses 28 to 30 are not in Luke and are among the special treasures of Matthew\'s Gospel. No sublimer words exist than this call of Jesus to the toiling and the burdened (pephortismenoi, perfect passive participle, state of weariness) to come to him. "I will refresh you" (kago anapauso humas). Far more than mere rest, rejuvenation. The English slang expression "rest up" is close to the idea of the Greek compound ana-pauo. It is causative active voice.',
  },
  {
    bookSlug: 'luke',
    chapter: 15,
    verse: 11,
    heading: 'The lost son',
    word: 'sons',
    body: 'Had (eichen). Imperfect active. Here (verses 11-32) we have the most famous of all the parables of Jesus, the Prodigal Son, which is in Luke alone. We have had the Lost Sheep, the Lost Coin, and now the Lost Son. Bruce notes that in the moral sphere there must be self-recovery to give ethical value to the rescue of the son who wandered away. That comes out beautifully in this allegory.',
  },
  {
    bookSlug: 'luke',
    chapter: 15,
    verse: 12,
    heading: 'The portion',
    word: 'share',
    body: 'The portion (to meros). The Jewish law allotted one-half as much to the younger son as to the elder, that is to say one-third of the estate (Deut. 21:17) at the death of the father. The father did not have to abdicate in favour of the sons, but "this very human parable here depicts the impatience of home restraints and the optimistic ambition of youth" (Ragg). And he divided (ho de dieilen). The second aorist active indicative of diaireo, an old and common verb to part in two.',
  },
  {
    bookSlug: 'luke',
    chapter: 15,
    verse: 13,
    heading: 'Wasted',
    word: 'wasted',
    body: 'Wasted (dieskorpisen). First aorist active indicative of diaskorpizo. More exactly he scattered his property. It is the word used of winnowing grain (Mt 25:24). With riotous living (zon asotos). Living dissolutely or profligately. The late adverb asotos (only here in the N.T.) from asotos (a privative and sozo), one that cannot be saved, a spendthrift, a prodigal. He went the limit of sinful excesses.',
  },
  {
    bookSlug: 'luke',
    chapter: 15,
    verse: 16,
    heading: 'The husks',
    word: 'pods',
    body: 'With the husks (ek ton keration). The word occurs here alone in the N.T. and is a diminutive of keras (horn) and so means little horn. It is used of the pods of the carob tree or locust tree still common in Palestine, so called from the shape of the pods like little horns. The gelatinous substance inside has a sweetish taste and is used for feeding swine and even for food by the lower classes. No man gave unto him (oudeis edidou autoi). Imperfect active. Continued refusal of anyone to allow him even the food of the hogs.',
  },
  {
    bookSlug: 'luke',
    chapter: 15,
    verse: 17,
    heading: 'Came to himself',
    word: 'himself',
    body: 'But when he came to himself (eis heauton de elthon). As if he had been far from himself as he was from home. As a matter of fact he had been away, out of his head, and now began to see things as they really were. I perish (ego de limoi hode apollumai). Every word here counts: While I on the other hand am here perishing with hunger.',
  },
  {
    bookSlug: 'luke',
    chapter: 15,
    verse: 20,
    heading: 'Ran',
    word: 'ran',
    body: 'Yet afar off (eti autou makran apechontos). Genitive absolute. This shows that the father had been looking for him to come back and was even looking at this very moment as he came in sight. Ran (dramon). Second aorist active participle of trecho. The eager look and longing of the father. Kissed (katephilesen). Note perfective use of kata: kissed him much, kissed him again and again.',
  },
  {
    bookSlug: 'luke',
    chapter: 15,
    verse: 22,
    heading: 'The best robe',
    word: 'robe',
    body: 'The best robe (stolen ten proten). Stole is an old word for a fine stately garment that comes down to the feet, the kind worn by kings. Literally, "a robe the first." But not the first that you find, but the first in rank and value, the finest in the house. This in contrast with his shabby clothes. A ring (daktulion). From daktulos, finger. Shoes (hupodemata). Sandals, "bound under." Both sandals and ring are marks of the freeman as slaves were barefooted.',
  },
  {
    bookSlug: 'luke',
    chapter: 15,
    verse: 24,
    heading: 'And is alive',
    word: 'alive',
    body: 'And is alive (kai anezeisen). First aorist active indicative of anazao, to live again. Literally, he was dead and he came back to life. He was lost (en apololos, periphrastic past perfect active of apollumi and intransitive, in a lost state) and he was found (heurethe). He is found after long waiting.',
  },
  {
    bookSlug: 'luke',
    chapter: 15,
    verse: 28,
    heading: 'But he was angry',
    word: 'angry',
    body: 'But he was angry (orgisthe). First aorist (ingressive) passive indicative. But he became angry, he flew into a rage (orge). This was the explosion as the result of long resentment towards the wayward brother and suspicion of the father\'s partiality for the erring son. Would not go in (ouk ethelen eiselthein). Imperfect tense (was not willing, refused). Entreated (parekalei). Imperfect tense, he kept on beseeching him.',
  },
  {
    bookSlug: 'luke',
    chapter: 15,
    verse: 32,
    heading: 'It was meet',
    word: 'celebrate',
    body: 'It was meet (edei). Imperfect tense. It expressed a necessity in the father\'s heart and in the joy of the return that justifies the feasting. The father repeats to the elder son the language of his heart used in verse 24 to his servants. A real father could do no less. Luke has produced a graphic pen picture here of God\'s love for the lost that justifies forever the coming of Christ to the world to seek and to save the lost.',
  },
  {
    bookSlug: 'acts',
    chapter: 2,
    verse: 1,
    heading: 'Pentecost',
    word: 'Pentecost',
    body: 'Was now come (en toi sumplerousthai). Luke\'s favourite idiom of en with the articular present infinitive passive, "in the being fulfilled completely (perfective use of sun-) as to the day of Pentecost." Whether the disciples expected the coming of the Holy Spirit on this day we do not know. Apparently this day of Pentecost fell on the Jewish Sabbath (our Saturday). It was the feast of first fruits. All together in one place (pantes homou epi to auto).',
  },
  {
    bookSlug: 'acts',
    chapter: 2,
    verse: 2,
    heading: 'A sound',
    word: 'sound',
    body: 'Suddenly (aphno). Old adverb, but in the N.T. only in Acts. A sound (echos). It was not wind, but a roar or reverberation "as of the rushing of a mighty wind" (hosper pheromenes pnoes biaias). It was "an echoing sound as of a mighty wind borne violently" (or rushing along like the whirr of a tornado). Pnoe (wind) is used here probably because of the use of pneuma in verse 4 of the Holy Spirit.',
  },
  {
    bookSlug: 'acts',
    chapter: 2,
    verse: 3,
    heading: 'Tongues like fire',
    word: 'Tongues',
    body: 'Parting asunder (diamerizomena). Present middle participle of diamerizo, to cleave asunder. The middle is probably correct and means that "the fire-like appearance presented itself at first, as it were, in a single body, and then suddenly parted in this direction and that; so that a portion of it rested on each of those present" (Hackett). The idea is not that each tongue was cloven, but each separate tongue looked like fire, not real fire, but looking like (hosei, as if) fire. It sat (ekathisen). A tongue that looked like fire sat upon each one.',
  },
  {
    bookSlug: 'acts',
    chapter: 2,
    verse: 4,
    heading: 'With other tongues',
    word: 'languages',
    body: 'With other tongues (heterais glossais). Other than their native tongues. Each one began to speak in a language that he had not acquired and yet it was a real language and understood by those from various lands familiar with them. It was not jargon, but intelligible language. As the Spirit gave them utterance (kathos to pneuma edidou apophthengesthai autois). Apophthengesthai is used of eager, elevated, impassioned utterance.',
  },
]

type Payload = { source: string; notes: RobertsonNote[] }

const bookLoaders = import.meta.glob('./robertson-books/*.json') as Record<
  string,
  () => Promise<{ default: Payload } | Payload>
>

const extraByVerse = new Map<string, RobertsonNote[]>()
const loadedBooks = new Set<string>()
const loading = new Map<string, Promise<void>>()
const listeners = new Set<() => void>()
let rwpVersion = 0

function verseKey(bookSlug: string, chapter: number, verse: number) {
  return `${bookSlug}:${chapter}:${verse}`
}

function fold(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function collidesWithSeed(note: RobertsonNote, seed: RobertsonNote[]) {
  for (const s of seed) {
    if (note.heading && s.heading && fold(note.heading) === fold(s.heading)) return true
    const a = fold(note.body)
    const b = fold(s.body)
    if (a && b && (a.includes(b) || b.includes(a)) && Math.min(a.length, b.length) >= 40) return true
  }
  return false
}

function addNotes(notes: RobertsonNote[]) {
  for (const n of notes) {
    const key = verseKey(n.bookSlug, n.chapter, n.verse)
    const list = extraByVerse.get(key) ?? []
    list.push(n)
    extraByVerse.set(key, list)
  }
  rwpVersion += 1
  listeners.forEach((fn) => fn())
}

export function subscribeRobertson(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function robertsonStoreVersion() {
  return rwpVersion
}

export async function ensureRobertsonBook(bookSlug: string) {
  if (loadedBooks.has(bookSlug)) return
  const path = `./robertson-books/${bookSlug}.json`
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
      console.warn(`Robertson book ${bookSlug} failed to load`, err)
    })
    .finally(() => {
      loading.delete(bookSlug)
    })
  loading.set(bookSlug, work)
  return work
}

export function useRobertson() {
  return useSyncExternalStore(subscribeRobertson, robertsonStoreVersion, () => 0)
}

export function notesForVerse(bookSlug: string, chapter: number, verse: number) {
  const seed = ROBERTSON.filter(
    (n) => n.bookSlug === bookSlug && n.chapter === chapter && n.verse === verse,
  )
  const extra = (extraByVerse.get(verseKey(bookSlug, chapter, verse)) ?? []).filter(
    (n) => !collidesWithSeed(n, seed),
  )
  const used = new Set(seed.map((n) => n.word?.toLowerCase()).filter(Boolean) as string[])
  const extras = extra.map((n) => {
    const key = n.word?.toLowerCase()
    if (key && used.has(key)) return { ...n, word: undefined }
    if (key) used.add(key)
    return n
  })
  return [...seed, ...extras]
}

export function notesForChapter(bookSlug: string, chapter: number) {
  const verses = new Set<number>()
  for (const n of ROBERTSON) {
    if (n.bookSlug === bookSlug && n.chapter === chapter) verses.add(n.verse)
  }
  const prefix = `${bookSlug}:${chapter}:`
  for (const key of extraByVerse.keys()) {
    if (key.startsWith(prefix)) verses.add(Number(key.slice(prefix.length)))
  }
  return [...verses].sort((a, b) => a - b).flatMap((v) => notesForVerse(bookSlug, chapter, v))
}

export function noteByWord(bookSlug: string, chapter: number, word: string) {
  const needle = word.trim().toLowerCase()
  return notesForChapter(bookSlug, chapter).find((n) => n.word?.toLowerCase() === needle)
}
