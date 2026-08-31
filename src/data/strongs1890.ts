/** Short glosses from Strong’s Exhaustive Concordance (1890), public domain. Not modern Strong’s, Vine, or Wuest. */

export type StrongsEntry = {
  id: string
  lemma: string
  gloss: string
}

const ENTRIES: Record<string, StrongsEntry> = {
  faith: {
    id: 'G4102',
    lemma: 'pistis',
    gloss: 'persuasion, i.e. credence; moral conviction; especially reliance upon Christ for salvation',
  },
  grace: {
    id: 'G5485',
    lemma: 'charis',
    gloss: 'graciousness (as gratifying), of manner or act; especially the divine influence upon the heart, and its reflection in the life',
  },
  walk: {
    id: 'G4043',
    lemma: 'peripateo',
    gloss: 'to tread all around, i.e. walk at large; figuratively, to live, deport oneself, follow',
  },
  love: {
    id: 'G26',
    lemma: 'agape',
    gloss: 'love, i.e. affection or benevolence; specially (plural) a love-feast',
  },
  hope: {
    id: 'G1680',
    lemma: 'elpis',
    gloss: 'expectation (abstract or concrete) or confidence',
  },
  pray: {
    id: 'G4336',
    lemma: 'proseuchomai',
    gloss: 'to pray to God, i.e. supplicate, worship',
  },
  prayer: {
    id: 'G4335',
    lemma: 'proseuche',
    gloss: 'prayer (worship); by implication an oratory (chapel)',
  },
  rest: {
    id: 'G373',
    lemma: 'anapauo',
    gloss: 'to repose (literally or figuratively); by implication, to refresh',
  },
  word: {
    id: 'G3056',
    lemma: 'logos',
    gloss: 'something said (including the thought); specially (with the article in John) the Divine Expression (i.e. Christ)',
  },
  world: {
    id: 'G2889',
    lemma: 'kosmos',
    gloss: 'orderly arrangement, i.e. decoration; by implication the world (in a wide or narrow sense, including its inhabitants)',
  },
  believe: {
    id: 'G4100',
    lemma: 'pisteuo',
    gloss: 'to have faith (in, upon, or with respect to a person or thing), i.e. credit; by implication to entrust',
  },
  peace: {
    id: 'G1515',
    lemma: 'eirene',
    gloss: 'peace (literally or figuratively); by implication prosperity',
  },
  spirit: {
    id: 'G4151',
    lemma: 'pneuma',
    gloss: 'a current of air, i.e. breath or a breeze; by analogy or figuratively a spirit; (divine) the Holy Spirit',
  },
  truth: {
    id: 'G225',
    lemma: 'aletheia',
    gloss: 'truth',
  },
  life: {
    id: 'G2222',
    lemma: 'zoe',
    gloss: 'life (literally or figuratively)',
  },
  light: {
    id: 'G5457',
    lemma: 'phos',
    gloss: 'luminousness (in the widest application, natural or artificial, literal or figurative)',
  },
  sin: {
    id: 'G266',
    lemma: 'hamartia',
    gloss: 'a sin (properly abstract)',
  },
  heart: {
    id: 'G2588',
    lemma: 'kardia',
    gloss: 'the heart, i.e. (figuratively) the thoughts or feelings (mind); also the middle',
  },
  lord: {
    id: 'G2962',
    lemma: 'kurios',
    gloss: 'supreme in authority, i.e. (as noun) controller; by implication Mr. (as a respectful title)',
  },
  LORD: {
    id: 'H3068',
    lemma: 'Yehovah',
    gloss: '(the) self-Existent or Eternal; Jehovah, Jewish national name of God',
  },
  god: {
    id: 'G2316',
    lemma: 'theos',
    gloss: 'a deity, especially (with the article) the supreme Divinity',
  },
  salvation: {
    id: 'G4991',
    lemma: 'soteria',
    gloss: 'rescue or safety (physically or morally)',
  },
  righteousness: {
    id: 'G1343',
    lemma: 'dikaiosune',
    gloss: 'equity (of character or act); specially (Christian) justification',
  },
  shepherd: {
    id: 'G4166',
    lemma: 'poimen',
    gloss: 'a shepherd (literally or figuratively)',
  },
  trust: {
    id: 'H982',
    lemma: 'batach',
    gloss: 'properly to hide for refuge; figuratively to trust, be confident or sure',
  },
  fear: {
    id: 'G5401',
    lemma: 'phobos',
    gloss: 'alarm or fright',
  },
  mercy: {
    id: 'G1656',
    lemma: 'eleos',
    gloss: 'compassion (human or divine, especially active)',
  },
  holy: {
    id: 'G40',
    lemma: 'hagios',
    gloss: 'sacred (physically pure, morally blameless or religious, ceremonially consecrated)',
  },
  glory: {
    id: 'G1391',
    lemma: 'doxa',
    gloss: 'glory (as very apparent), in a wide application',
  },
  heaven: {
    id: 'G3772',
    lemma: 'ouranos',
    gloss: 'the sky; by extension heaven (as the abode of God)',
  },
  kingdom: {
    id: 'G932',
    lemma: 'basileia',
    gloss: 'royalty, i.e. (abstractly) rule, or (concretely) a realm',
  },
}

const VARIANTS: Record<string, string> = {
  faith: 'faith',
  grace: 'grace',
  walk: 'walk',
  walks: 'walk',
  walked: 'walk',
  walking: 'walk',
  love: 'love',
  loves: 'love',
  loved: 'love',
  loving: 'love',
  hope: 'hope',
  hopes: 'hope',
  hoped: 'hope',
  hoping: 'hope',
  pray: 'pray',
  prays: 'pray',
  prayed: 'pray',
  praying: 'pray',
  prayer: 'prayer',
  prayers: 'prayer',
  rest: 'rest',
  rests: 'rest',
  rested: 'rest',
  resting: 'rest',
  word: 'word',
  words: 'word',
  world: 'world',
  worlds: 'world',
  believe: 'believe',
  believes: 'believe',
  believed: 'believe',
  believing: 'believe',
  peace: 'peace',
  spirit: 'spirit',
  spirits: 'spirit',
  truth: 'truth',
  life: 'life',
  light: 'light',
  lights: 'light',
  sin: 'sin',
  sins: 'sin',
  sinned: 'sin',
  sinning: 'sin',
  heart: 'heart',
  hearts: 'heart',
  lord: 'lord',
  god: 'god',
  salvation: 'salvation',
  righteous: 'righteousness',
  righteousness: 'righteousness',
  shepherd: 'shepherd',
  shepherds: 'shepherd',
  trust: 'trust',
  trusts: 'trust',
  trusted: 'trust',
  trusting: 'trust',
  fear: 'fear',
  fears: 'fear',
  feared: 'fear',
  fearing: 'fear',
  mercy: 'mercy',
  mercies: 'mercy',
  holy: 'holy',
  glory: 'glory',
  heaven: 'heaven',
  heavens: 'heaven',
  kingdom: 'kingdom',
}

export type StrongsHit = {
  entry: StrongsEntry
  word: string
  verse: number
  x: number
  y: number
}

export function lookupStrongs(raw: string): StrongsEntry | undefined {
  const trimmed = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
  if (!trimmed) return undefined
  if (trimmed === 'LORD' || trimmed === "LORD's" || trimmed === 'LORD’s') {
    return ENTRIES.LORD
  }
  const key = trimmed
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/'s$/, '')
  const lemma = VARIANTS[key]
  if (!lemma) return undefined
  return ENTRIES[lemma]
}

export const STRONGS_SOURCE = "Strong’s Exhaustive Concordance, 1890 (public domain)"
