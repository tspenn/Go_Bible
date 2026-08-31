export type ScofieldNote = {
  bookSlug: string
  chapter: number
  verse: number
  heading?: string
  body: string
}

export function noteKey(n: ScofieldNote, indexInChapter: number) {
  return `${n.bookSlug}-${n.chapter}-${n.verse}-${indexInChapter}`
}

export function markerLetter(indexInChapter: number) {
  return String.fromCharCode(97 + (indexInChapter % 26))
}

/**
 * Seed notes from the 1917 Scofield Reference Bible (public domain).
 * Short extracts only. Expand later from the 1917 text — never the 1967 New Scofield.
 */
export const SCOFIELD: ScofieldNote[] = [
  {
    bookSlug: 'genesis',
    chapter: 1,
    verse: 1,
    heading: 'God',
    body: 'Elohim (sometimes El or Elah), English form "God," the first of the names of Deity, is a plural noun in form, but is used with a singular meaning, and with a singular verb. The plural form represents the Trinity.',
  },
  {
    bookSlug: 'john',
    chapter: 1,
    verse: 1,
    heading: 'the Word',
    body: `Gr. Logos (log'-os) = "a thought or concept, and the expression or utterance of that thought." As a designation of Christ it occurs in the writings of John.`,
  },
  {
    bookSlug: 'john',
    chapter: 3,
    verse: 16,
    heading: 'world / everlasting life',
    body: 'Gr. kosmos = mankind. "Everlasting life" is a life, not a mere endless existence. It is the life of God revealed in Christ, imparted to the believer.',
  },
  {
    bookSlug: 'john',
    chapter: 14,
    verse: 6,
    heading: 'the way',
    body: 'Christ is not one way among many. He is the way to the Father.',
  },
  {
    bookSlug: 'romans',
    chapter: 8,
    verse: 28,
    heading: 'all things',
    body: 'The "all things" of this verse include the sufferings of vs. 17-27. They work together for good to them that love God.',
  },
  {
    bookSlug: 'romans',
    chapter: 10,
    verse: 17,
    heading: 'faith',
    body: 'Faith is not a mere belief in historical facts. It comes by hearing the word of God, and lays hold of Christ.',
  },
  {
    bookSlug: '2-corinthians',
    chapter: 5,
    verse: 7,
    heading: 'walk by faith',
    body: 'The Christian walk is not directed by the seen and temporal, but by the unseen and eternal. (Cf. Heb. 11:1.)',
  },
  {
    bookSlug: 'hebrews',
    chapter: 11,
    verse: 1,
    heading: 'faith',
    body: 'Faith is taking God at His word. It is the substance (or assurance) of things hoped for, the evidence of things not seen.',
  },
  {
    bookSlug: 'hebrews',
    chapter: 11,
    verse: 6,
    heading: 'without faith',
    body: 'The two necessities: that God is, and that He rewards those who seek Him. Faith must rest on both.',
  },
  {
    bookSlug: 'proverbs',
    chapter: 3,
    verse: 5,
    heading: 'trust',
    body: 'Trust is the Old Testament word nearest to the New Testament "faith." It excludes self-confidence.',
  },
  {
    bookSlug: 'matthew',
    chapter: 11,
    verse: 28,
    heading: 'rest',
    body: 'Two rests are here: (1) the rest of salvation, given; (2) the rest of communion, found in the yoke with Christ.',
  },
  {
    bookSlug: '1-peter',
    chapter: 5,
    verse: 7,
    heading: 'care',
    body: 'Anxiety is forbidden because it both distrusts and dishonours God, who cares.',
  },
]

export function notesForVerse(bookSlug: string, chapter: number, verse: number) {
  return SCOFIELD.filter(
    (n) => n.bookSlug === bookSlug && n.chapter === chapter && n.verse === verse,
  )
}

export function notesForChapter(bookSlug: string, chapter: number) {
  return SCOFIELD.filter((n) => n.bookSlug === bookSlug && n.chapter === chapter)
}
