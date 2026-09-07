/**
 * WEB uses Yahweh as a bare name. English reads that name as "the LORD"
 * (KJV/ASV convention). Vocative "O Yahweh" stays "O LORD".
 * Adonai + Yahweh ("Lord Yahweh") becomes "Lord GOD", not "Lord the LORD".
 */
export function renderYahweh(raw) {
  let s = raw
  s = s.replace(/\bLord Yahweh['’]s\b/g, 'Lord GOD’s')
  s = s.replace(/\bLord Yahweh\b/g, 'Lord GOD')
  s = s.replace(/\bYahweh['’]s\b/g, 'the LORD’s')
  s = s.replace(/\b([Oo]h?)\s+Yahweh\b/g, '$1 LORD')
  s = s.replace(/\bYahweh\b/g, 'the LORD')
  return capitalizeTheLord(s)
}

/** Same rules after a naive Yahweh → LORD pass (current web.json). */
export function englishTheLord(raw) {
  let s = raw
  s = s.replace(/\bLord LORD['’]s\b/g, 'Lord GOD’s')
  s = s.replace(/\bLord LORD\b/g, 'Lord GOD')
  s = s.replace(/\bLORD(?:['’]s)?\b/g, (match, offset) => {
    if (hasDeterminer(s, offset)) return match
    const article = needsCap(s, offset) ? 'The ' : 'the '
    return article + match
  })
  return s
}

function hasDeterminer(s, offset) {
  const before = s.slice(Math.max(0, offset - 8), offset)
  return /(?:^|[^A-Za-z])(?:the|The|O|o|Oh|oh) $/.test(before)
}

function needsCap(s, offset) {
  if (offset === 0) return true
  return /(?:^|[.!?…]["'”’)]?\s+|["“‘]\s*)$/.test(s.slice(0, offset))
}

export function capitalizeTheLord(s) {
  return s.replace(/(^|[.!?…]["'”’)]?\s+|["“‘]\s*)the LORD/g, (_, p1) => `${p1}The LORD`)
}
