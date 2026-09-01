/** Native selection of two or more words in chapter text. */

export function wordCount(text: string) {
  return text.match(/\p{L}[\p{L}’']*/gu)?.length ?? 0
}

export type LiveWash = {
  verse: number
  phrase: string
}

export type ChapterSelection = {
  phrase: string
  verses: number[]
  washes: LiveWash[]
  x: number
  y: number
}

function intersectRangeWithNode(range: Range, node: Node): Range | null {
  if (!range.intersectsNode(node)) return null
  const nodeRange = document.createRange()
  nodeRange.selectNodeContents(node)
  const out = range.cloneRange()
  if (out.compareBoundaryPoints(Range.START_TO_START, nodeRange) < 0) {
    out.setStart(nodeRange.startContainer, nodeRange.startOffset)
  }
  if (out.compareBoundaryPoints(Range.END_TO_END, nodeRange) > 0) {
    out.setEnd(nodeRange.endContainer, nodeRange.endOffset)
  }
  return out.collapsed ? null : out
}

export function readChapterSelection(
  root: HTMLElement,
  point?: { x: number; y: number },
): ChapterSelection | null {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)
  if (!root.contains(range.commonAncestorContainer)) return null

  const washes: LiveWash[] = []
  for (const p of root.querySelectorAll<HTMLElement>('[data-verse]')) {
    const verse = Number(p.dataset.verse)
    if (!Number.isFinite(verse)) continue
    const piece = intersectRangeWithNode(range, p)
    if (!piece) continue
    const phrase = piece.toString().replace(/\s+/g, ' ').trim()
    if (!phrase) continue
    washes.push({ verse, phrase })
  }
  if (washes.length === 0) return null

  const phrase = sel.toString().replace(/\s+/g, ' ').trim()
  if (wordCount(phrase) < 2) return null

  const rect = range.getBoundingClientRect()
  return {
    phrase,
    verses: washes.map((w) => w.verse),
    washes,
    x: point?.x ?? rect.left,
    y: point?.y ?? rect.bottom,
  }
}

export function citation(bookName: string, chapter: number, verses: number[]) {
  const first = verses[0]
  const last = verses[verses.length - 1]
  if (first == null) return `${bookName} ${chapter}`
  if (last == null || last === first) return `${bookName} ${chapter}:${first}`
  return `${bookName} ${chapter}:${first}–${last}`
}

export function quoteForShare(bookName: string, chapter: number, verses: number[], phrase: string) {
  return `“${phrase}” — ${citation(bookName, chapter, verses)}`
}

export async function copyText(text: string) {
  await navigator.clipboard.writeText(text)
}

export async function shareQuote(opts: { title: string; text: string; url: string }) {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(opts)
      return 'shared' as const
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled' as const
    }
  }
  await copyText(`${opts.text}\n${opts.url}`)
  return 'copied' as const
}
