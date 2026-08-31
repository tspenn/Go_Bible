export type DictEntry = {
  slug: string
  name: string
  body: string
  source: 'Easton' | 'Smith'
}

/** Public-domain dictionary seeds (Easton 1897 / Smith). */
export const DICTIONARY: DictEntry[] = [
  {
    slug: 'faith',
    name: 'Faith',
    source: 'Easton',
    body: 'Faith is in general the persuasion of the mind that a certain statement is true. Its primary idea is trust. In the New Testament it is trust in Christ as the Saviour.',
  },
  {
    slug: 'grace',
    name: 'Grace',
    source: 'Easton',
    body: 'Grace is the free unmerited love and favor of God. Saving grace is the work of the Spirit in calling, renewing, and keeping the believer.',
  },
  {
    slug: 'prayer',
    name: 'Prayer',
    source: 'Easton',
    body: 'Prayer is converse with God. It includes adoration, confession, thanksgiving, and petition.',
  },
  {
    slug: 'hope',
    name: 'Hope',
    source: 'Easton',
    body: 'Hope is an expectation of future good. In Scripture it is the confident waiting for what God has promised.',
  },
  {
    slug: 'shepherd',
    name: 'Shepherd',
    source: 'Easton',
    body: 'A frequent figure for the care of God and of Christ over His people. "The Lord is my shepherd."',
  },
  {
    slug: 'word',
    name: 'Word',
    source: 'Easton',
    body: 'Used of the revelation of God, and as a title of Christ: "the Word was God."',
  },
  {
    slug: 'rest',
    name: 'Rest',
    source: 'Easton',
    body: 'The Sabbath rest; also the rest Christ gives to the weary who come to Him.',
  },
]

export function findDict(slug: string) {
  return DICTIONARY.find((d) => d.slug === slug)
}

export function dictForVerse(bookSlug: string, chapter: number, verse: number) {
  const key = `${bookSlug}:${chapter}:${verse}`
  const map: Record<string, string[]> = {
    'genesis:1:1': ['word'],
    'psalms:23:1': ['shepherd'],
    'john:1:1': ['word'],
    'john:3:16': ['faith', 'grace'],
    'john:14:6': ['word'],
    'matthew:11:28': ['rest'],
    'romans:10:17': ['faith'],
    '2-corinthians:5:7': ['faith'],
    'hebrews:11:1': ['faith', 'hope'],
    'hebrews:11:6': ['faith'],
    'proverbs:3:5': ['faith'],
    'james:1:17': ['grace'],
    '1-peter:5:7': ['prayer'],
  }
  const slugs = map[key] ?? []
  return slugs.map(findDict).filter((d): d is DictEntry => Boolean(d))
}
