/** Everyday search words → wording that actually appears in the Go-Bible text or Nave. */

const TO_CORPUS: Record<string, string[]> = {
  worry: ['worries', 'worrying', 'anxious', 'anxiety', 'care'],
  worries: ['worry', 'anxious', 'anxiety', 'care'],
  worrying: ['worry', 'worries', 'anxious', 'anxiety', 'care'],
  anxious: ['anxiety', 'worry', 'worries', 'care'],
  anxiety: ['anxious', 'worry', 'worries', 'care'],
  depression: ['despair', 'despondency', 'sorrow', 'grief', 'affliction'],
  depressed: ['despair', 'despondency', 'sorrow', 'grief'],
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

export function expandSearchTerms(q: string): string[] {
  const n = q.trim().toLowerCase()
  if (n.length < 2) return []
  const mapped = TO_CORPUS[n] ?? TO_CORPUS[stem(n)] ?? []
  return [...new Set([n, ...inflect(n), ...mapped])]
}

function dropBroad(q: string, terms: string[]) {
  const n = q.trim().toLowerCase()
  return terms.filter((t) => t === n || !BROAD.has(t))
}

/** For verse text: skip broad expansions like “care” that hit half the Bible. */
export function scriptureSearchTerms(q: string): string[] {
  return dropBroad(q, expandSearchTerms(q))
}

/** Notes and commentary: keep “care” only when that is what the reader typed. */
export function commentarySearchTerms(q: string): string[] {
  return dropBroad(q, expandSearchTerms(q))
}

export function hasWord(hay: string, term: string) {
  const h = hay.toLowerCase()
  const t = term.toLowerCase()
  if (t.length < 2) return false
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
