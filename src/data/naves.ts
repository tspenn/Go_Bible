export type NaveTopic = {
  slug: string
  name: string
  summary: string
  refs: string[]
}

/** Seed from public-domain Nave’s structure. References only; verse text lives in KJV. */
export const TOPICS: NaveTopic[] = [
  {
    slug: 'faith',
    name: 'Faith',
    summary: 'Trust in God; the substance of things hoped for.',
    refs: ['Hebrews 11:1', 'Hebrews 11:6', 'Romans 10:17', '2 Corinthians 5:7'],
  },
  {
    slug: 'walking',
    name: 'Walking',
    summary: 'Walking with God; walking by faith rather than sight.',
    refs: ['2 Corinthians 5:7', 'Genesis 1:1'],
  },
  {
    slug: 'grace',
    name: 'Grace',
    summary: 'The unearned favor of God.',
    refs: ['John 1:1', 'James 1:17'],
  },
  {
    slug: 'prayer',
    name: 'Prayer',
    summary: 'Coming to God with care, need, and thanksgiving.',
    refs: ['Matthew 11:28', '1 Peter 5:7', 'Psalms 46:10'],
  },
  {
    slug: 'hope',
    name: 'Hope',
    summary: 'Quiet confidence in what God has promised.',
    refs: ['Hebrews 11:1', 'Isaiah 40:31', 'Romans 8:28'],
  },
  {
    slug: 'trust',
    name: 'Trust',
    summary: 'Leaning on the Lord rather than our own understanding.',
    refs: ['Proverbs 3:5', 'Proverbs 3:6', 'Psalms 23:1'],
  },
  {
    slug: 'gratitude',
    name: 'Gratitude',
    summary: 'Remembering every good gift comes from above.',
    refs: ['James 1:17', 'Psalms 23:1'],
  },
  {
    slug: 'home',
    name: 'Home',
    summary: 'The household as a place of rest and care.',
    refs: ['Psalms 23:2', 'John 14:1', 'John 14:27'],
  },
  {
    slug: 'sabbath',
    name: 'Sabbath',
    summary: 'Rest given by God; stilling the heart.',
    refs: ['Psalms 46:10', 'Matthew 11:28'],
  },
  {
    slug: 'garden',
    name: 'Garden',
    summary: 'Green places, still waters, and the care of the Shepherd.',
    refs: ['Psalms 23:2', 'Genesis 1:1', 'Matthew 6:26'],
  },
]

export function findTopic(slug: string) {
  return TOPICS.find((t) => t.slug === slug)
}

export function searchTopics(q: string) {
  const n = q.trim().toLowerCase()
  if (!n) return TOPICS
  return TOPICS.filter(
    (t) =>
      t.name.toLowerCase().includes(n) ||
      t.summary.toLowerCase().includes(n) ||
      t.refs.some((r) => r.toLowerCase().includes(n)),
  )
}
