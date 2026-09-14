/** Compact Nave search keys from related slugs and subtopic labels. */

const STOP = new Set(
  `a an and also as at be by concerning exemplified for from general in instances miscellaneous minor of or relating see scriptures sub the to topics unclassified with`
    .split(' '),
)

export function topicKeys(related = [], subtopics = []) {
  const words = new Set()
  for (const slug of related) {
    for (const part of String(slug)
      .toLowerCase()
      .split(/[^a-z]+/)) {
      if (part.length >= 4 && !STOP.has(part)) words.add(part)
    }
  }
  for (const sub of subtopics) {
    for (const part of String(sub.label || '')
      .toLowerCase()
      .split(/[^a-z]+/)) {
      if (part.length >= 5 && !STOP.has(part)) words.add(part)
    }
  }
  return [...words].slice(0, 24).join(' ')
}
