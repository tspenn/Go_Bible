export const MAGAZINE_URL = 'https://faith.skylandpublishing.com'
export const STORE_URL = 'https://faith.skylandpublishing.com/catalog'

export type StarterTopic = {
  id: string
  title: string
  naveSlug: string
  naveName: string
  scofield: {
    bookSlug: string
    chapter: number
    verse: number
    label: string
  }
}

/** Featured questions on the Topics page, each tied to Nave’s 1896 and Scofield 1917. */
export const STARTER_TOPICS: StarterTopic[] = [
  {
    id: 'jesus',
    title: 'Jesus (Who is Jesus)',
    naveSlug: 'jesus-the-christ',
    naveName: 'Jesus, the Christ',
    scofield: { bookSlug: 'john', chapter: 1, verse: 1, label: 'the Word' },
  },
  {
    id: 'salvation',
    title: 'Salvation',
    naveSlug: 'salvation',
    naveName: 'Salvation',
    scofield: { bookSlug: 'romans', chapter: 1, verse: 16, label: 'salvation' },
  },
  {
    id: 'faith',
    title: 'What is Faith?',
    naveSlug: 'faith',
    naveName: 'Faith',
    scofield: { bookSlug: 'hebrews', chapter: 11, verse: 1, label: 'faith' },
  },
  {
    id: 'church',
    title: 'What is the Church?',
    naveSlug: 'church',
    naveName: 'Church',
    scofield: { bookSlug: 'matthew', chapter: 16, verse: 18, label: 'church' },
  },
  {
    id: 'god',
    title: 'Who is God?',
    naveSlug: 'god',
    naveName: 'God',
    scofield: { bookSlug: 'genesis', chapter: 1, verse: 1, label: 'God' },
  },
  {
    id: 'believe',
    title: 'Why Believe',
    naveSlug: 'gospel',
    naveName: 'Gospel',
    scofield: { bookSlug: 'john', chapter: 6, verse: 69, label: 'we believe' },
  },
  {
    id: 'eternal-life',
    title: 'Eternal Life',
    naveSlug: 'eternal-life',
    naveName: 'Eternal Life',
    scofield: { bookSlug: 'john', chapter: 3, verse: 16, label: 'everlasting life' },
  },
  {
    id: 'judgment',
    title: 'Judgement',
    naveSlug: 'judgment',
    naveName: 'Judgment',
    scofield: { bookSlug: 'john', chapter: 12, verse: 31, label: 'judgments' },
  },
]

export const MORE_STARTERS: StarterTopic[] = [
  {
    id: 'prayer',
    title: 'Prayer',
    naveSlug: 'prayer',
    naveName: 'Prayer',
    scofield: { bookSlug: 'acts', chapter: 12, verse: 5, label: 'prayer' },
  },
  {
    id: 'grace',
    title: 'Grace',
    naveSlug: 'grace',
    naveName: 'Grace',
    scofield: { bookSlug: 'ephesians', chapter: 2, verse: 8, label: 'grace' },
  },
  {
    id: 'holy-spirit',
    title: 'Holy Spirit',
    naveSlug: 'holy-spirit',
    naveName: 'Holy Spirit',
    scofield: { bookSlug: 'john', chapter: 7, verse: 39, label: 'Spirit' },
  },
  {
    id: 'repentance',
    title: 'Repentance',
    naveSlug: 'repentance',
    naveName: 'Repentance',
    scofield: { bookSlug: 'acts', chapter: 5, verse: 31, label: 'repentance' },
  },
  {
    id: 'resurrection',
    title: 'Resurrection',
    naveSlug: 'resurrection',
    naveName: 'Resurrection',
    scofield: { bookSlug: 'revelation', chapter: 20, verse: 5, label: 'first resurrection' },
  },
  {
    id: 'walking',
    title: 'Walking by Faith',
    naveSlug: 'walking',
    naveName: 'Walking',
    scofield: { bookSlug: '2-corinthians', chapter: 5, verse: 7, label: 'walk by faith' },
  },
]

export const MORE_NAVE_STARTERS: StarterTopic[] = [
  {
    id: 'atonement',
    title: 'Atonement',
    naveSlug: 'atonement',
    naveName: 'Atonement',
    scofield: { bookSlug: 'leviticus', chapter: 16, verse: 6, label: 'Atonement' },
  },
  {
    id: 'forgiveness',
    title: 'Forgiveness',
    naveSlug: 'forgiveness',
    naveName: 'Forgiveness',
    scofield: { bookSlug: 'matthew', chapter: 6, verse: 12, label: 'we forgive our debtors' },
  },
  {
    id: 'hope',
    title: 'Hope',
    naveSlug: 'hope',
    naveName: 'Hope',
    scofield: { bookSlug: '1-thessalonians', chapter: 1, verse: 3, label: 'work of faith' },
  },
  {
    id: 'love',
    title: 'Love',
    naveSlug: 'love',
    naveName: 'Love',
    scofield: { bookSlug: '2-john', chapter: 1, verse: 5, label: 'that we love one another' },
  },
  {
    id: 'word-of-god',
    title: 'Word of God',
    naveSlug: 'word-of-god',
    naveName: 'Word of God',
    scofield: { bookSlug: 'jeremiah', chapter: 2, verse: 1, label: 'word of the Lord' },
  },
  {
    id: 'names-of-god',
    title: 'Names of God',
    naveSlug: 'names-of-god',
    naveName: 'Names of God',
    scofield: { bookSlug: 'genesis', chapter: 17, verse: 1, label: 'Almighty God' },
  },
]
