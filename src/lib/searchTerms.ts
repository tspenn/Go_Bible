/** Everyday search words → wording that actually appears in the Go-Bible text or Nave. */

/** Comfort / hope wording that is actually in the Go-Bible text — not dumps of despair. */
const LIFT_DEPRESSION = [
  'hope in god',
  'god of hope',
  'god of all comfort',
  'broken hearted',
  'broken in heart',
  'crushed spirit',
  'heavily burdened',
  'in nothing be anxious',
  'casting all your worries',
  'cast your burden',
  'weeping may stay',
  'hope',
  'comfort',
  'consolation',
  'cheerfulness',
]

const TO_CORPUS: Record<string, string[]> = {
  worry: ['worries', 'worrying', 'anxious', 'anxiety', 'care'],
  worries: ['worry', 'anxious', 'anxiety', 'care'],
  worrying: ['worry', 'worries', 'anxious', 'anxiety', 'care'],
  anxious: ['anxiety', 'worry', 'worries', 'care'],
  anxiety: ['anxious', 'worry', 'worries', 'care'],
  depression: LIFT_DEPRESSION,
  depressed: LIFT_DEPRESSION,
  lonely: ['desolate', 'forsaken'],
  loneliness: ['desolate', 'forsaken'],
  stress: ['distress', 'distressed', 'trouble', 'troubled'],
  stressed: ['distress', 'trouble', 'anxious'],
  addiction: ['drunkard', 'drunkenness'],
  addicted: ['drunkard', 'drunkenness'],
  alcoholic: ['drunkard', 'drunkenness'],
  alcoholism: ['drunkard', 'drunkenness'],
  anger: ['angry', 'wrath'],
  angry: ['anger', 'wrath'],
  mad: ['anger', 'wrath', 'angry'],
  fear: ['afraid', 'fearful'],
  afraid: ['fear'],
  scared: ['fear', 'afraid'],
  panic: ['fear', 'afraid', 'terror'],
  doubt: ['doubting', 'unbelief'],
  doubts: ['doubting', 'unbelief'],
  doubtful: ['doubting', 'unbelief'],
  shame: ['ashamed'],
  ashamed: ['shame'],
  embarrassed: ['ashamed', 'shame'],
  guilt: ['guilty'],
  guilty: ['guilt'],
  grief: ['grieve', 'grieved', 'mourning', 'mourn', 'sorrow'],
  grieving: ['grief', 'mourn', 'sorrow'],
  mourning: ['mourn', 'grief', 'sorrow'],
  sad: ['sorrow', 'sorrowful', 'grief'],
  sadness: ['sorrow', 'grief'],
  pride: ['proud', 'haughty'],
  proud: ['pride', 'haughty'],
  humble: ['humility', 'meek', 'meekness'],
  humility: ['humble', 'meekness'],
  jealous: ['jealousy', 'envy'],
  jealousy: ['jealous', 'envy'],
  envy: ['envious', 'jealousy'],
  hate: ['hatred', 'malice'],
  hatred: ['hate', 'malice'],
  revenge: ['vengeance'],
  forgive: ['forgiven', 'forgiveness', 'pardon'],
  forgiven: ['forgive', 'forgiveness'],
  forgiveness: ['forgive', 'forgiven', 'pardon'],
  repent: ['repentance', 'repented'],
  repentance: ['repent'],
  lust: ['covet', 'covetousness'],
  greedy: ['covetousness', 'covet'],
  greed: ['covetousness'],
  comfort: ['comforter', 'consolation'],
  heal: ['healed', 'healing', 'sickness'],
  healing: ['heal', 'healed'],
  sick: ['sickness', 'disease'],
  illness: ['sickness', 'disease'],
  tired: ['weary', 'weariness'],
  exhausted: ['weary', 'weariness'],
  burnout: ['weary', 'weariness'],
  burden: ['burdened', 'yoke'],
  burdened: ['burden', 'yoke'],
  poor: ['poverty', 'needy'],
  poverty: ['poor', 'needy'],
  friend: ['friends', 'friendship'],
  lonelyish: ['desolate'],
  widow: ['widows'],
  orphan: ['fatherless'],
  rejection: ['rejected', 'despised'],
  rejected: ['rejection', 'despised'],
  persecution: ['persecuted'],
  suffering: ['suffer', 'affliction', 'afflicted'],
  suffer: ['suffering', 'affliction'],
  pain: ['affliction', 'suffering'],
  temptation: ['tempted', 'tempt'],
  tempted: ['temptation'],
  patience: ['patient', 'longsuffering'],
  kind: ['kindness', 'mercy'],
  kindness: ['kind', 'mercy'],
  pray: ['prayer', 'praying', 'petition'],
  prayer: ['pray', 'praying'],
  joy: ['joyful', 'rejoice'],
  happy: ['joy', 'joyful', 'rejoice'],
  happiness: ['joy', 'rejoice'],
  strong: ['strength', 'mighty'],
  weak: ['weakness'],
  save: ['saved', 'salvation'],
  saved: ['save', 'salvation'],
  salvation: ['saved', 'save'],
  holy: ['holiness', 'sanctify'],
  money: ['riches', 'wealth'],
  rich: ['riches', 'wealth'],
  work: ['labor', 'labour'],
  marriage: ['married', 'husband', 'wife'],
  married: ['marriage'],
  parent: ['parents', 'children'],
  parents: ['children', 'father', 'mother'],
  child: ['children'],
  kids: ['children', 'child'],
  death: ['dying', 'die'],
  dying: ['death', 'die'],
  griefstricken: ['grief', 'sorrow'],
  hopeless: ['despair', 'despondency'],
  hopelessness: ['despair', 'despondency'],
  suicidal: ['despair', 'despondency'],
  anxietyattack: ['anxiety', 'fear'],
  trauma: ['affliction', 'trouble'],
  abuse: ['oppression', 'violence'],
  violence: ['violent', 'oppression'],
  peace: ['peaceful'],
  rest: ['rested', 'quiet'],
  sleep: ['slept', 'sleeping'],
  courage: ['courageous', 'bold'],
  brave: ['courage', 'bold'],
  honest: ['honesty', 'truth'],
  lie: ['lying', 'liar', 'falsehood'],
  lying: ['lie', 'liar'],
  gossip: ['talebearer', 'slander'],
  slander: ['slanderer'],
  lazy: ['slothful', 'sluggard'],
}

const BROAD = new Set([
  'care',
  'heart',
  'love',
  'rest',
  'poor',
  'wine',
  'death',
  'god',
  'man',
  'men',
  'son',
  'world',
  'rich',
  'riches',
  'wicked',
  'sin',
  'die',
  'child',
  'children',
  'father',
  'mother',
  'wife',
  'husband',
])

/** Too common in Nave labels to use as a keys match. */
const KEY_SKIP = new Set([
  'affliction',
  'sorrow',
  'grief',
  'trouble',
  'poor',
  'death',
  'suffering',
  'prayer',
  'love',
  'heart',
  'care',
  'rich',
  'riches',
  'wicked',
  'sin',
  'blessing',
  'comfort',
  'righteous',
  'spirit',
  'worldly',
])

export function skipTopicKeys(term: string) {
  return KEY_SKIP.has(term)
}

export function stem(word: string) {
  const w = word.toLowerCase()
  if (w.length < 4) return w
  if (w.endsWith('ies') && w.length > 5) return `${w.slice(0, -3)}y`
  if (w.endsWith('ied') && w.length > 5) return `${w.slice(0, -3)}y`
  if (w.endsWith('ness') && w.length > 7) return stem(w.slice(0, -4))
  if (w.endsWith('ing') && w.length > 6) {
    let b = w.slice(0, -3)
    if (b.length > 3 && b.at(-1) === b.at(-2)) b = b.slice(0, -1)
    return b
  }
  if (w.endsWith('ed') && w.length > 5) {
    const b = w.slice(0, -2)
    return b.endsWith('i') ? `${b.slice(0, -1)}y` : b
  }
  if (w.endsWith('es') && w.length > 5 && !w.endsWith('sses')) return w.slice(0, -2)
  if (w.endsWith('s') && w.length > 4 && !w.endsWith('ss') && !w.endsWith('us')) return w.slice(0, -1)
  return w
}

export function inflect(term: string) {
  const w = term.trim().toLowerCase()
  const out = new Set<string>()
  if (w.length < 2) return []
  out.add(w)
  if (w.endsWith('ies') && w.length > 5) out.add(`${w.slice(0, -3)}y`)
  else if (w.endsWith('ing') && w.length > 5) {
    out.add(w.slice(0, -3))
    out.add(`${w.slice(0, -3)}e`)
  } else if (w.endsWith('ed') && w.length > 4) {
    out.add(w.slice(0, -2))
    out.add(w.slice(0, -1))
  } else if (/(?:ion|ness|ment|ly)$/.test(w)) {
    if (!w.endsWith('ly')) out.add(`${w}s`)
  } else if (w.endsWith('y') && w.length > 3 && !/[aeiou]y$/.test(w)) {
    out.add(`${w.slice(0, -1)}ies`)
    out.add(`${w.slice(0, -1)}ied`)
  } else if (w.endsWith('e')) {
    out.add(`${w}d`)
    out.add(`${w}s`)
    out.add(`${w.slice(0, -1)}ing`)
    if (w.endsWith('ve')) out.add(`${w}n`)
  } else {
    out.add(`${w}s`)
    if (!/(?:th|ship|hood)$/.test(w)) {
      out.add(`${w}ed`)
      out.add(`${w}ing`)
    }
  }
  return [...out].filter((t) => t.length >= 2)
}

const PHRASE_SKIP = new Set([
  'that',
  'with',
  'from',
  'this',
  'have',
  'them',
  'they',
  'will',
  'your',
  'their',
  'into',
  'unto',
  'upon',
  'give',
  'make',
  'come',
  'went',
])

export function expandSearchTerms(q: string): string[] {
  const n = q.trim().toLowerCase()
  if (n.length < 2) return []
  if (n.includes(' ')) {
    const words = n.split(/[^a-z]+/).filter((w) => w.length >= 4 && !PHRASE_SKIP.has(w))
    return [...new Set([n, ...words])]
  }
  const mapped = TO_CORPUS[n] ?? TO_CORPUS[stem(n)] ?? []
  return [...new Set([n, ...inflect(n), ...mapped])]
}

/** Drop a/an/the so a typed phrase can still match the Go-Bible wording. */
export function foldArticles(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9']+/g, ' ')
    .replace(/\b(a|an|the)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Glue words people add when they only remember part of a verse. */
const PHRASE_STOP = new Set([
  'a',
  'an',
  'the',
  'to',
  'of',
  'and',
  'or',
  'in',
  'on',
  'for',
  'you',
  'your',
  'me',
  'my',
  'us',
  'our',
  'i',
  'we',
  'he',
  'she',
  'it',
  'is',
  'be',
  'not',
  'but',
  'as',
  'at',
  'by',
  'so',
  'if',
  'do',
  'did',
  'was',
  'were',
  'are',
  'been',
  'that',
  'this',
  'with',
  'from',
  'them',
  'they',
  'will',
  'unto',
  'upon',
  'into',
  'shall',
  'said',
  'says',
  'his',
  'her',
  'him',
  'who',
  'which',
  'what',
  'when',
  'then',
  'also',
  'all',
  'any',
  'can',
  'may',
  'has',
  'had',
  'have',
  'lord',
])

export function phraseContentWords(q: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const w of foldArticles(q).split(' ')) {
    if (PHRASE_STOP.has(w) || seen.has(w)) continue
    if (w.length < 3 && w !== 'am') continue
    seen.add(w)
    out.push(w)
  }
  return out
}

/** Words people often swap when they only remember a verse in part. */
const RECALL_NEAR: Record<string, string[]> = {
  light: ['life'],
  life: ['light'],
}

function tokenFits(hayTok: string, want: string) {
  if (hayTok === want) return true
  if ((RECALL_NEAR[want] ?? []).includes(hayTok)) return true
  if (hayTok.length >= 4 && want.length >= 4) {
    const a = stem(hayTok)
    const b = stem(want)
    return a.length >= 4 && a === b
  }
  return false
}

function firstFit(hayToks: string[], want: string, from: number) {
  for (let i = from; i < hayToks.length; i++) {
    if (tokenFits(hayToks[i] ?? '', want)) return i
  }
  return -1
}

function wordsInOrder(hayToks: string[], wants: string[]) {
  let from = 0
  for (const w of wants) {
    const at = firstFit(hayToks, w, from)
    if (at < 0) return false
    from = at + 1
  }
  return true
}

/** Lower is better. -1 means this verse is not a remembered-phrase hit. */
export function rememberedVerseScore(text: string, q: string): number {
  const foldedQ = foldArticles(q)
  const foldedHay = foldArticles(text)
  if (foldedQ.length >= 6 && foldedHay.includes(foldedQ)) return 0
  const wants = phraseContentWords(q)
  if (wants.length < 2) return -1
  const hayToks = foldedHay.split(' ').filter(Boolean)
  const hits = wants.filter((w) => firstFit(hayToks, w, 0) >= 0)
  const need = wants.length <= 3 ? wants.length : wants.length - 1
  if (hits.length < need) return -1
  const inOrder = wordsInOrder(hayToks, hits)
  if (hits.length < wants.length && !inOrder) return -1
  if (hits.length === wants.length && inOrder) return 1
  if (hits.length === wants.length) return 2
  return 3 + (wants.length - hits.length)
}

function dropBroad(q: string, terms: string[]) {
  const n = q.trim().toLowerCase()
  return terms.filter((t) => t === n || !BROAD.has(t))
}

/** For verse text: skip broad expansions like “care” that hit half the Bible. */
export function scriptureSearchTerms(q: string): string[] {
  const n = q.trim().toLowerCase()
  if (n.includes(' ')) return [n]
  return dropBroad(q, expandSearchTerms(q))
}

/** Notes and commentary: keep “care” only when that is what the reader typed. */
export function commentarySearchTerms(q: string): string[] {
  return dropBroad(q, expandSearchTerms(q))
}

/** Put these verses first. Literal hits for a few everyday words are all the wound, none of the help. */
const LIFT_REFS: [string, number, number][] = [
  ['psalms', 34, 18],
  ['psalms', 42, 5],
  ['psalms', 147, 3],
  ['psalms', 30, 5],
  ['psalms', 55, 22],
  ['isaiah', 61, 1],
  ['isaiah', 40, 31],
  ['matthew', 11, 28],
  ['john', 14, 27],
  ['romans', 15, 13],
  ['2-corinthians', 1, 3],
  ['2-corinthians', 1, 4],
  ['philippians', 4, 6],
  ['1-peter', 5, 7],
  ['revelation', 21, 4],
]
const SCRIPTURE_FIRST: Record<string, [string, number, number][]> = {
  depression: LIFT_REFS,
  depressed: LIFT_REFS,
}

export function boostedScriptureRefs(q: string): { bookSlug: string; chapter: number; verse: number }[] {
  const n = q.trim().toLowerCase()
  const rows = SCRIPTURE_FIRST[n]
  if (!rows) return []
  return rows.map(([bookSlug, chapter, verse]) => ({ bookSlug, chapter, verse }))
}

/** Topic names against the typed word and its expansions (so “depression” can hit Hope). */
export function nameMatchesQuery(name: string, q: string) {
  const terms = expandSearchTerms(q).filter((t) => t.length >= 2 && !t.includes(' '))
  return terms.some((t, i) => nameMatchesTerm(name, t, i === 0))
}

export function hasWord(hay: string, term: string) {
  const t = term.toLowerCase().trim()
  if (t.length < 2) return false
  if (t.includes(' ')) {
    const h = foldArticles(hay)
    const p = foldArticles(t)
    return p.length >= 4 && h.includes(p)
  }
  const h = hay.toLowerCase()
  let i = 0
  while (i <= h.length - t.length) {
    const at = h.indexOf(t, i)
    if (at < 0) return false
    const before = at === 0 || !/[a-z]/.test(h[at - 1] ?? '')
    const after = at + t.length >= h.length || !/[a-z]/.test(h[at + t.length] ?? '')
    if (before && after) return true
    i = at + 1
  }
  return false
}

export function hayMatches(hay: string, terms: string[]) {
  const h = hay.toLowerCase()
  return terms.some((t) => hasWord(h, t))
}

/** Whole-word / headword match so “care” does not pull “Careah”. */
export function nameMatchesTerm(name: string, term: string, loose: boolean) {
  const n = name.toLowerCase()
  if (loose) return n.includes(term) || wordsMatchStem(n, term)
  if (n === term) return true
  if (n.startsWith(`${term} `) || n.endsWith(` ${term}`)) return true
  if (n.includes(` ${term} `)) return true
  return wordsMatchStem(n, term)
}

function wordsMatchStem(name: string, term: string) {
  const want = stem(term)
  if (want.length < 4) return false
  for (const w of name.toLowerCase().split(/[^a-z]+/)) {
    if (w.length < 4) continue
    if (stem(w) === want) return true
  }
  return false
}
