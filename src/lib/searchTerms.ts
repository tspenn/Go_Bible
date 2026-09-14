/** Modern search words → historic Nave / Bible wording. Keep this list short. */

const ALIASES: Record<string, string[]> = {
  worry: ['worries', 'worrying', 'anxious', 'anxiety', 'care'],
  worries: ['worry', 'anxious', 'anxiety', 'care'],
  worrying: ['worry', 'worries', 'anxious', 'anxiety', 'care'],
  anxious: ['anxiety', 'worry', 'worries', 'care'],
  anxiety: ['anxious', 'worry', 'worries', 'care'],
}

export function expandSearchTerms(q: string): string[] {
  const n = q.trim().toLowerCase()
  if (n.length < 2) return []
  return [...new Set([n, ...(ALIASES[n] ?? [])])]
}

function dropBroadCare(q: string, terms: string[]) {
  const n = q.trim().toLowerCase()
  if (n === 'care' || n === 'cares') return terms
  return terms.filter((t) => t !== 'care')
}

/** For verse text: skip broad words like “care” that hit half the Bible. */
export function scriptureSearchTerms(q: string): string[] {
  return dropBroadCare(q, expandSearchTerms(q))
}

/** Notes and commentary: keep “care” only when that is what the reader typed. */
export function commentarySearchTerms(q: string): string[] {
  return dropBroadCare(q, expandSearchTerms(q))
}

export function hayMatches(hay: string, terms: string[]) {
  const h = hay.toLowerCase()
  return terms.some((t) => h.includes(t))
}

/** Whole-word / headword match so “care” does not pull “Careah”. */
export function nameMatchesTerm(name: string, term: string, loose: boolean) {
  const n = name.toLowerCase()
  if (loose) return n.includes(term)
  if (n === term) return true
  if (n.startsWith(`${term} `) || n.endsWith(` ${term}`)) return true
  return n.includes(` ${term} `)
}
