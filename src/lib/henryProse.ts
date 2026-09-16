/** Break Matthew Henry’s print-packed Exposition into readable paragraphs. */

const ROMAN = '(?:XVIII|XVII|XVI|XIV|XIII|XII|XIX|XV|VIII|VII|III|II|IV|IX|VI|XI|XX|V|X|I)'

const HENRY_BREAK = new RegExp(
  [
    `(?=\\b${ROMAN}\\.\\s+[A-Z“"'‘])`,
    '(?=\\(\\d{1,2}\\.?\\)\\s+[A-Z“"\'‘])',
    '(?=\\[\\d{1,2}\\.?\\]\\s+[A-Z“"\'‘])',
    '(?<=[.!?,:;—–])\\s+(?=\\d{1,2}\\.\\s+[A-Z“"\'‘])',
    '(?=\\bNote,\\s+[A-Z])',
    '(?=\\b(?:First|Secondly|Thirdly|Fourthly|Fifthly|Sixthly|Lastly),\\s+[A-Z])',
  ].join('|'),
)

function tidy(s: string) {
  return s.replace(/\s+/g, ' ').replace(/\s+([,;:.])/g, '$1').trim()
}

const MARKER = new RegExp(
  `^(?:\\(\\d|\\[\\d|\\d{1,2}\\.\\s|${ROMAN}\\.\\s|Note,\\s|First,|Secondly|Thirdly|Fourthly|Fifthly|Sixthly|Lastly,)`,
)

function isShortLead(para: string) {
  return para.length < 28 && !MARKER.test(para)
}

function mergeShortLeads(paras: string[]) {
  const out: string[] = []
  for (const para of paras) {
    if (isShortLead(para) && out.length > 0) {
      out[out.length - 1] = `${out[out.length - 1]} ${para}`
      continue
    }
    out.push(para)
  }
  if (out.length >= 2 && isShortLead(out[0]!)) {
    out[1] = `${out[0]} ${out[1]}`
    out.shift()
  }
  return out
}

export function henryParagraphs(body: string): string[] {
  const t = body.replace(/\r\n/g, '\n').trim()
  if (!t) return []
  const chunks = /\n/.test(t) ? t.split(/\n+/).map(tidy).filter(Boolean) : [tidy(t)]
  const out: string[] = []
  for (const chunk of chunks) {
    for (const piece of chunk.split(HENRY_BREAK)) {
      const para = tidy(piece)
      if (para) out.push(para)
    }
  }
  return mergeShortLeads(out)
}

export function henryPointClass(para: string) {
  if (/^\(\d{1,2}\.?\)\s/.test(para) || /^\[\d{1,2}\.?\]\s/.test(para)) return 'hen-sub'
  if (/^\d{1,2}\.\s/.test(para)) return 'hen-point'
  if (/^(?:First|Secondly|Thirdly|Fourthly|Fifthly|Sixthly|Lastly),\s/.test(para)) return 'hen-point'
  if (new RegExp(`^${ROMAN}\\.\\s`).test(para) || /^Note,\s/.test(para)) return 'hen-major'
  return undefined
}
