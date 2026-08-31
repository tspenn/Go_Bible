/**
 * Build src/data/easton.json from public-domain Easton 1897 (and Smith
 * only when Easton has no headword). Run: node scripts/build-easton.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const eastonLines = fs.readFileSync(path.join(root, 'scripts/raw/easton.jsonl'), 'utf8')
const smithLines = fs.readFileSync(path.join(root, 'scripts/raw/smith.jsonl'), 'utf8')
const web = JSON.parse(fs.readFileSync(path.join(root, 'src/data/web.json'), 'utf8'))

const TOPICAL = new Set(['faith', 'grace', 'hope', 'prayer', 'shepherd', 'sabbath', 'rest'])

const SHORT_NAMES = new Set(['og', 'ur', 'ai', 'ar', 'on', 'uz', 'no', 'er'])

/** Function words and theological titles — never dictionary names. */
const SKIP_NAMES = new Set(
  `
  a an the and but or nor for so yet as if then than when while where why how
  who whom whose what which that this these those there here thus also too not
  no yes yea nay lo behold both either neither each every any some all most many
  few more less such other another same own very just even only still
  about above after again against along among around before behind below beneath
  beside besides between beyond during except inside into onto over through
  throughout toward towards under underneath until upon within without from
  unto of to in on by at with into onto upon
  i me my mine we our ours you your yours he him his she her hers it its they
  them their theirs am is are was were be been being have has had do does did
  doing will would shall should may might must can could
  let come go came went see saw say said make made give gave take took know
  knew call called send sent hear heard tell told bring brought put set keep
  kept find found look looked ask asked begin began live lived die died
  god jesus christ lord jehovah yahweh father son holy amen alpha omega blessed
  whoever whatever wherever however therefore because according concerning
  now out please arise leave return everything afterward increase one high walk
  pairs ben isn't don't almighty prince everlasting mighty wonderful
  `.trim().split(/\s+/),
)

/** Easton common-noun / English-word headwords: do not auto-mark in verses. */
const COMMON = new Set(
  `
  a ah aha air aloes alms almond almonds almug aloed altar altars amber angel angels
  anger ankle anointing ant ape apples apron ark arm arms army arrow arrows ashes
  ass asses axe baby bag baker balance balances baldness bank banks banquet baptism
  barber barley barn barns basket baskets bat bath baths beard beast beasts bed beds
  bee bees beggar belly bird birds birth bit bite bitter bitterness black blanket
  blemish blood blot boat boats body boil bond bone bones book books bottle bottles
  bow bowl bowls box boy brass bread brick bricks bride bridegroom bridle brier
  briers brimstone bronze broom brother brothers building bull bulls burden burdens
  burial burn burning bush butter buy buyer calf caldron calf camels camp candle
  candlestick cane captain captains captivity carpenter cart castle cattle cave caves
  cedar censer chain chains chamber chambers charge chariot chariots cheek chest
  child children church churches city cities clay cloak cloud clouds coal coals coat
  coats cock coffin command commandment commandments congregation copper cord cords
  corn corner corners cottage couch counsel counsellor counselor count country
  courage court courts covenant covenants cow creation creature creatures crown
  crowns crystal cup cups curtain curtains cymbal cymbals dance darkness dart darts
  daughter daughters day days deacon deacons death debt debtor deed deeds den desert
  deserts dew diamond diet disciple disciples disease diseases dish dishes divorce
  dog dogs door doors dove doves dragon dream dreams dress drink drinking dromedary
  dung dust eagle eagles ear earring earth earthquake east eating egg eggs elder
  elders elm engine engines evening ewe eye eyes face faces famine farm fasting fat
  father fathers feast feasts fig figs finger fire fish fisher fishers fishing flame
  flax flesh flint flock flocks flood floor flour flower flowers fly food foot forest
  fork fowl fowls fox foxes friend friends frog frogs fruit furnace garden gardens
  gate gates giant giants girdle glass gleaning goat goats gold gospel gospels gourd
  government governor governors grain grapes grass grave graves hail hair hammer
  hand hands harp harps harvest hat hatred head heads heart hearts heaven heavens
  hedge hen herb herbs herd herds hill hills hire hive honey horn horns horse horses
  hour hours house houses hunger husband husbands hymn hymns idol idols image images
  incense inheritance iron island ivory jackal jar jars jaw jewel jewels joy judge
  judges judgment key keys kid kids kill killing king kings kiss kite knee knife
  knowledge labour ladder lake lamb lambs lamp lamps land lands language lantern
  lattice law laws leaf leaves leaven leprosy letter letters light lightning linen
  lion lions lip lips locust locusts lodge loft look looking lord lords
  love magician magicians maid maiden mail man men mantle market marriage master
  masters meal meat medicine merchant merchants mercy mill mills month months moon
  morning mortar moth mother mothers mountain mountains mouse mouth mule mules
  murder murderer music mustard myrrh nail nails name names nation nations neck
  needle neighbor net nets night nights north number numbers nurse oak oaks oath
  oaths offering offerings oil olive olives onion onions oven ox oxen palace palaces
  palm paper parable parables pasture peace pearl pearls people peoples pestilence
  physician physicians piece pieces pillar pillars pillow pit pitch pitcher place
  plague plagues plain plains pledge plow plowshare pomegranate pool pools poor pot
  pots potter poverty praise prayer prayers priest priests prison prisons prophet
  prophets proverb proverbs psalm psalms purple rain rainbow raven ravens
  reaper reapers reward river rivers road robe rock rocks rod rods roof roofs
  room rooms rope rose rowing sack sacks sacrifice sacrifices saddle salt sand sandal
  sandals scarlet scepter school scorpion sea seas seal seals seed seeds seer seers
  servant servants shade shadow shame sheep shepherd shepherds shield ship ships
  shoe shoes shoulder sick sickness siege sign signs silk silver sin sins sister
  sisters skin skull slave slaves sleep snow soap soldier soldiers son sons song
  songs sorcery soul souls south spear spears spider spirit spirits spoon staff star
  stars steel steward stick sticks stone stones storm stranger strangers straw street
  streets sun supper sword swords tabernacle table tables tail talent talents tax
  taxes teacher teachers tear tears temple temples tent tents thief thieves thorn
  thorns threshing throne thrones thunder time times tin tomb tombs tongue tongues
  tooth topaz tower towers treasure treasures tree trees trench tribute trumpet
  trumpets tunic turtle uncle uncleanness valley valleys veil vessel vessels village
  villages vine vines vinegar vineyard vineyards vision visions voice wages wall
  walls war wars water waters wave waves wax way ways wedding well wells west wheat
  wheel wheels widow widows wife wives wilderness wind window windows wine wineskin
  wing wings winter wolf wolves woman women wood wool word words work works world
  worm worms wound wounds year years yoke young youth
  `
    .trim()
    .split(/\s+/),
)

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function cleanBody(defs) {
  const text = (defs || [])
    .join('\n\n')
    .replace(/\[(\d+)\]/g, '')
    .replace(/\s+\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
  if (text.length <= 1800) return text
  const cut = text.slice(0, 1800)
  const at = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.\n'))
  return (at > 400 ? cut.slice(0, at + 1) : cut).trim()
}

function isStub(body) {
  return /^(see )\S/i.test(body.trim()) && body.trim().length < 80
}

function isBookTitle(term) {
  return /\b(book|books|epistle|gospel|prophecies) of\b/i.test(term) || /gospel according to/i.test(term)
}

function aliasesFromTerm(term) {
  const aliases = new Set()
  const normalized = term.replace(/Æ/g, 'AE').replace(/æ/g, 'ae')
  aliases.add(normalized)
  if (normalized !== term) aliases.add(term)

  if (normalized.startsWith('AE') && normalized.length > 3) {
    aliases.add('Ae' + normalized.slice(2))
    aliases.add('E' + normalized.slice(2))
  }

  const comma = normalized.match(/^([^,]+),\s*(.+)$/)
  if (comma) {
    const main = comma[1].trim()
    const rest = comma[2].trim()
    if (/^the$/i.test(rest)) {
      aliases.add(main)
      aliases.add('the ' + main)
    } else if (/ of(?: the)?$/i.test(rest) && !isBookTitle(normalized)) {
      aliases.add(`${rest} ${main}`)
    } else if (!isBookTitle(normalized) && !/^(a |the |image of|waters of|wood of|language of|means of|art of|type)/i.test(rest)) {
      aliases.add(`${rest} ${main}`)
    }
  }

  return [...aliases].filter((a) => a.length > 1)
}

function parseJsonl(raw) {
  return raw
    .trim()
    .split(/\n/)
    .map((line) => JSON.parse(line))
}

const eastonRaw = parseJsonl(eastonLines)
const smithRaw = parseJsonl(smithLines)

const EXTRA_ALIASES = {
  'Holy Ghost': ['Holy Spirit', 'Spirit'],
  Jew: ['Jews'],
  Pharisees: ['Pharisee'],
  Israel: ['Israelite', 'Israelites'],
  Judea: ['Judaea'],
  Egypt: ['Egyptian', 'Egyptians'],
  Moab: ['Moabite', 'Moabites'],
  Ammon: ['Ammonite', 'Ammonites'],
  Edom: ['Edomite', 'Edomites'],
  Philistine: ['Philistines'],
  Canaan: ['Canaanite', 'Canaanites'],
  Amorite: ['Amorites'],
  Hittite: ['Hittites'],
  Perizzite: ['Perizzites'],
  Hivite: ['Hivites'],
  Jebusite: ['Jebusites'],
  Silas: ['Silvanus'],
  Elijah: ['Elias'],
  Isaiah: ['Esaias'],
  Counsellor: ['Wonderful Counselor'],
  Lamb: ['Lamb of God'],
  'Word of God': ['the word of God'],
  AEnon: ['Enon', 'Aenon'],
  Peter: ['Simon Peter'],
}

const SKIP_TERMS = new Set(['Spirit', 'Spirit, Holy', 'A', 'Ah!', 'Aha!', 'Hail!'])

/** Labels that must match case (title / Logos / Holy Spirit as Spirit). */
const SENSITIVE = {
  'Holy Ghost': ['Spirit'],
  'Word, The': ['Word'],
}

function makeEntry(term, defs, source) {
  const body = cleanBody(defs)
  if (!body || isStub(body)) return null
  if (SKIP_TERMS.has(term)) return null
  let name = term.replace(/Æ/g, 'AE').replace(/, The$/, '')
  if (term === 'Holy Ghost') name = 'Spirit'
  if (term === 'AEnon') name = 'Enon'
  const aliases = new Set(aliasesFromTerm(term).filter((a) => a.toLowerCase() !== name.toLowerCase()))
  for (const extra of EXTRA_ALIASES[term] || []) aliases.add(extra)
  if (term === 'Holy Ghost') aliases.add('Holy Ghost')
  if (term === 'AEnon') aliases.add('AEnon')
  const slug = slugify(term === 'Word, The' ? 'word-the' : term === 'Holy Ghost' ? 'spirit' : name)
  const sensitive = SENSITIVE[term] || []
  const topical = TOPICAL.has(name.toLowerCase())
  return {
    slug,
    name,
    aliases: [...aliases].filter((a) => a.toLowerCase() !== name.toLowerCase()),
    body,
    source,
    sensitive,
    topical,
  }
}

const bySlug = new Map()
const byLabel = new Map()

function addLabel(label, entry) {
  const key = label.toLowerCase()
  if (!byLabel.has(key)) byLabel.set(key, [])
  byLabel.get(key).push({ label, entry })
}

function addEntry(entry) {
  if (!entry) return
  if (bySlug.has(entry.slug)) return
  bySlug.set(entry.slug, entry)
  addLabel(entry.name, entry)
  for (const a of entry.aliases) addLabel(a, entry)
}

for (const row of eastonRaw) {
  addEntry(makeEntry(row.term, row.definitions, 'Easton'))
}

function lookup(label) {
  const hits = byLabel.get(label.toLowerCase())
  if (!hits?.length) return undefined
  return hits[0].entry
}

const used = new Set()
function markUsed(entry) {
  if (entry) used.add(entry.slug)
}

for (const slug of [...bySlug.keys()]) {
  const e = bySlug.get(slug)
  if (e.topical) used.add(e.slug)
}
markUsed(lookup('Holy Ghost'))
markUsed(lookup('Word'))
markUsed(lookup('word of God'))
markUsed(lookup('Enon'))
markUsed(lookup('Salim'))

function peel(token) {
  const m = token.match(/^([A-Za-z][A-Za-z'’\-]*?)(?:['’]s)?$/)
  return m ? m[1].replace(/’/g, "'") : null
}

const unmatched = new Map()
for (const book of web.books) {
  for (const ch of book.chapters) {
    for (const text of ch) {
      const tokens = []
      const re = /\p{L}[\p{L}’']*/gu
      let m
      while ((m = re.exec(text))) {
        tokens.push({ t: m[0], i: m.index })
      }
      for (let i = 0; i < tokens.length; i++) {
        for (let n = 4; n >= 1; n--) {
          const slice = tokens.slice(i, i + n)
          if (slice.length < n) continue
          const phrase = slice.map((s) => s.t).join(' ')
          const core = peel(phrase) || phrase
          const entry = lookup(core) || lookup(phrase)
          if (entry) {
            const sensitiveHit = entry.sensitive.some((s) => s === core || s === phrase)
            const firstCap = /^\p{Lu}/u.test(slice[0].t)
            if (entry.topical || sensitiveHit || firstCap) {
              used.add(entry.slug)
            }
            break
          }
          if (n === 1) {
            const word = slice[0].t
            if (!/^\p{Lu}/u.test(word)) continue
            const key = (peel(word) || word).toLowerCase()
            if (SKIP_NAMES.has(key) || COMMON.has(key)) continue
            if (key.length < 3 && !SHORT_NAMES.has(key)) continue
            if (!unmatched.has(key)) unmatched.set(key, `${book.slug} ${word}`)
          }
        }
      }
    }
  }
}

const smithByTerm = new Map(smithRaw.map((r) => [r.term.toLowerCase(), r]))
const smithAdded = []
for (const [key, loc] of unmatched) {
  if (lookup(key)) continue
  if (SKIP_NAMES.has(key) || COMMON.has(key)) continue
  if (key.length < 3 && !SHORT_NAMES.has(key)) continue
  const row = smithByTerm.get(key)
  if (!row) continue
  const entry = makeEntry(row.term, row.definitions, 'Smith')
  if (!entry) continue
  if (SKIP_NAMES.has(entry.name.toLowerCase())) continue
  addEntry(entry)
  used.add(entry.slug)
  smithAdded.push(`${entry.name} (${loc})`)
}

const out = [...used]
  .map((slug) => bySlug.get(slug))
  .filter(Boolean)
  .filter((e) => {
    const key = e.name.toLowerCase()
    if (SKIP_NAMES.has(key)) return false
    if (key.length < 3 && !SHORT_NAMES.has(key) && !e.topical) return false
    return true
  })
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(({ slug, name, aliases, body, source, sensitive, topical }) => ({
    slug,
    name,
    aliases,
    body,
    source,
    ...(sensitive.length ? { sensitive } : {}),
    ...(topical ? { topic: true } : {}),
  }))

const dest = path.join(root, 'src/data/easton.json')
fs.writeFileSync(dest, JSON.stringify(out))
console.log(`wrote ${out.length} entries to src/data/easton.json (${(fs.statSync(dest).size / 1024).toFixed(0)} KB)`)
console.log(`Smith fill-ins: ${smithAdded.length}`, smithAdded.slice(0, 30).join('; '))
const still = [...unmatched.keys()].filter((k) => !lookup(k) && !COMMON.has(k) && !SKIP_NAMES.has(k))
console.log(`WEB capitalized tokens with no Easton/Smith headword: ${still.length}`)
console.log(still.slice(0, 40).join(', '))
