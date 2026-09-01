import { useEffect, useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { dictForWord, dictSpansInText, type DictEntry } from '../data/dictionary'
import { phraseSpan } from '../data/scofield'
import {
  lookupStrongs,
  STRONGS_SOURCE,
  type StrongsEntry,
  type StrongsHit,
} from '../data/strongs1890'

const HOLD_MS = 480
const MOVE_PX = 10

function peelToken(token: string) {
  const m = token.match(/^([^\p{L}\p{N}]*)([\p{L}\p{N}’']+)([^\p{L}\p{N}]*)$/u)
  if (!m) return null
  return { pre: m[1], core: m[2], post: m[3] }
}

export type WordPopup =
  | { kind: 'strongs'; hit: StrongsHit }
  | { kind: 'dict'; entry: DictEntry; word: string; verse: number; x: number; y: number }

export type MineMark = {
  phrase: string
  glyph: string
  title: string
  onOpen: () => void
  key: string
}

export type WashSpan = {
  phrase: string
  color: string
}

function Pressable({
  as = 'span',
  className,
  title,
  style,
  onShort,
  onHold,
  children,
}: {
  as?: 'span' | 'button'
  className?: string
  title?: string
  style?: CSSProperties
  onShort?: (x: number, y: number) => void
  onHold?: (x: number, y: number) => void
  children: ReactNode
}) {
  const timer = useRef<number>(0)
  const origin = useRef({ x: 0, y: 0 })
  const held = useRef(false)

  function clear() {
    if (timer.current) {
      window.clearTimeout(timer.current)
      timer.current = 0
    }
  }

  function point(target: HTMLElement) {
    const box = target.getBoundingClientRect()
    return { x: box.left, y: box.bottom }
  }

  function onPointerDown(e: PointerEvent<HTMLElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    held.current = false
    origin.current = { x: e.clientX, y: e.clientY }
    const target = e.currentTarget
    clear()
    if (!onHold) return
    timer.current = window.setTimeout(() => {
      timer.current = 0
      held.current = true
      window.getSelection()?.removeAllRanges()
      const { x, y } = point(target)
      onHold(x, y)
    }, HOLD_MS)
  }

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    if (!timer.current && !held.current) return
    const dx = e.clientX - origin.current.x
    const dy = e.clientY - origin.current.y
    if (dx * dx + dy * dy > MOVE_PX * MOVE_PX) clear()
  }

  function onPointerUp(e: PointerEvent<HTMLElement>) {
    const hadTimer = timer.current !== 0
    clear()
    if (held.current) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    const dx = e.clientX - origin.current.x
    const dy = e.clientY - origin.current.y
    if (dx * dx + dy * dy > MOVE_PX * MOVE_PX) return
    if (!onShort) return
    if (hadTimer || e.pointerType === 'mouse') {
      const { x, y } = point(e.currentTarget)
      onShort(x, y)
    }
  }

  const props = {
    className,
    title,
    style,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: clear,
    onPointerLeave: clear,
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
  }

  if (as === 'button') {
    return (
      <button type="button" {...props}>
        {children}
      </button>
    )
  }
  return <span {...props}>{children}</span>
}

type RwpMark = { word: string; letter: string; title: string; onOpen: () => void }
export type ScoMark = {
  phrase: string
  letter: string
  title: string
  onOpen: () => void
  key: string
}

function WordBits({
  text,
  verse,
  dict,
  onOpen,
  rwpMarks,
  onMark,
}: {
  text: string
  verse: number
  dict: DictEntry[]
  onOpen: (popup: WordPopup) => void
  rwpMarks: RwpMark[]
  onMark?: (phrase: string, x: number, y: number) => void
}) {
  const leftover = [...rwpMarks]
  const bits = text.split(/(\s+)/)
  return bits.map((bit, i) => {
    if (!bit || /^\s+$/.test(bit)) return <span key={i}>{bit}</span>
    const peeled = peelToken(bit)
    const entry = peeled ? lookupStrongs(peeled.core) : undefined
    const dictHit = peeled ? dictForWord(peeled.core, dict) : undefined
    const markAt = peeled
      ? leftover.findIndex((m) => m.word.toLowerCase() === peeled.core.toLowerCase())
      : -1
    const mark = markAt >= 0 ? leftover.splice(markAt, 1)[0] : undefined
    const letter = mark ? (
      <button type="button" className="callout" title={mark.title} onClick={mark.onOpen}>
        {mark.letter}
      </button>
    ) : null
    const phrase = peeled?.core ?? bit
    const hold = onMark ? (x: number, y: number) => onMark(phrase, x, y) : undefined

    if (peeled && (entry || dictHit)) {
      return (
        <span key={i}>
          <Pressable
            className="word-hit"
            onHold={hold}
            onShort={(x, y) => {
              if (entry) {
                onOpen({ kind: 'strongs', hit: { entry, word: peeled.core, verse, x, y } })
                return
              }
              if (dictHit) {
                onOpen({ kind: 'dict', entry: dictHit, word: peeled.core, verse, x, y })
              }
            }}
          >
            {bit}
          </Pressable>
          {letter}
        </span>
      )
    }
    return (
      <span key={i}>
        <Pressable className="word-hit" onHold={hold}>
          {bit}
        </Pressable>
        {letter}
      </span>
    )
  })
}

function wordSpan(text: string, word: string) {
  const needle = word.trim()
  if (!needle) return null
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = text.match(new RegExp(`\\b${escaped}\\b`, 'i'))
  if (!m || m.index == null) return null
  return { start: m.index, end: m.index + m[0].length }
}

export function VerseWords({
  text,
  verse,
  dict,
  onOpen,
  rwpMarks,
  scoMarks,
  washes,
  mineMarks,
  onMark,
}: {
  text: string
  verse: number
  dict: DictEntry[]
  onOpen: (popup: WordPopup) => void
  rwpMarks?: RwpMark[]
  scoMarks?: ScoMark[]
  washes?: WashSpan[]
  mineMarks?: MineMark[]
  onMark?: (phrase: string, x: number, y: number) => void
}) {
  const rwp = rwpMarks ?? []
  const mine = mineMarks ?? []
  const sco = (scoMarks ?? [])
    .map((mark) => {
      const span = mark.phrase ? phraseSpan(text, mark.phrase) : null
      return span ? { start: span.start, end: span.end, mark } : null
    })
    .filter((x): x is { start: number; end: number; mark: ScoMark } => x != null)
  const names = dictSpansInText(text)
  const rwpSpans = rwp
    .map((mark) => {
      const span = wordSpan(text, mark.word)
      return span ? { start: span.start, end: span.end, mark } : null
    })
    .filter((x): x is { start: number; end: number; mark: RwpMark } => x != null)
  const washSpans = (washes ?? [])
    .map((w) => {
      const span = phraseSpan(text, w.phrase)
      return span ? { start: span.start, end: span.end, color: w.color } : null
    })
    .filter((x): x is { start: number; end: number; color: string } => x != null)
  const mineSpans = mine
    .map((mark) => {
      const span = phraseSpan(text, mark.phrase)
      return span ? { start: span.start, end: span.end, mark } : null
    })
    .filter((x): x is { start: number; end: number; mark: MineMark } => x != null)

  if (sco.length === 0 && names.length === 0 && washSpans.length === 0 && mineSpans.length === 0) {
    return (
      <WordBits text={text} verse={verse} dict={dict} onOpen={onOpen} rwpMarks={rwp} onMark={onMark} />
    )
  }

  const cuts = new Set<number>([0, text.length])
  for (const r of [...sco, ...names, ...rwpSpans, ...washSpans, ...mineSpans]) {
    cuts.add(r.start)
    cuts.add(r.end)
  }
  const points = [...cuts].sort((a, b) => a - b)
  const chunks: ReactNode[] = []

  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i]
    const to = points[i + 1]
    if (from >= to) continue
    const slice = text.slice(from, to)
    const scoHere = sco.find((r) => r.start <= from && r.end >= to)
    const dictHere = names.find((r) => r.start <= from && r.end >= to)
    const washHere = washSpans.find((r) => r.start <= from && r.end >= to)
    const style = washHere ? { backgroundColor: washHere.color } : undefined
    const holdPhrase = scoHere?.mark.phrase ?? dictHere?.matched ?? slice.trim()
    const hold = onMark && holdPhrase ? (x: number, y: number) => onMark(holdPhrase, x, y) : undefined

    if (scoHere) {
      const className = dictHere ? 'sco-phrase dict-hit' : 'sco-phrase'
      chunks.push(
        <Pressable
          key={`s${from}-${scoHere.mark.key}`}
          as="button"
          className={className}
          title={scoHere.mark.title}
          style={style}
          onHold={hold}
          onShort={scoHere.mark.onOpen ? () => scoHere.mark.onOpen() : undefined}
        >
          {slice}
        </Pressable>,
      )
    } else if (dictHere) {
      chunks.push(
        <Pressable
          key={`d${from}-${dictHere.entry.slug}`}
          as="button"
          className="dict-hit"
          title={dictHere.entry.name}
          style={style}
          onHold={hold}
          onShort={(x, y) => {
            onOpen({
              kind: 'dict',
              entry: dictHere.entry,
              word: slice,
              verse,
              x,
              y,
            })
          }}
        >
          {slice}
        </Pressable>,
      )
    } else {
      chunks.push(
        <span key={`t${from}`} className={washHere ? 'word-wash' : undefined} style={style}>
          <WordBits
            text={slice}
            verse={verse}
            dict={dict}
            onOpen={onOpen}
            rwpMarks={[]}
            onMark={onMark}
          />
        </span>,
      )
    }

    for (const mark of sco.filter((r) => r.end === to)) {
      chunks.push(
        <button
          key={`scall-${mark.mark.key}`}
          type="button"
          className="callout"
          title={mark.mark.title}
          onClick={mark.mark.onOpen}
        >
          {mark.mark.letter}
        </button>,
      )
    }
    for (const mark of rwpSpans.filter((r) => r.end === to)) {
      chunks.push(
        <button
          key={`rcall-${mark.mark.letter}-${to}`}
          type="button"
          className="callout"
          title={mark.mark.title}
          onClick={mark.mark.onOpen}
        >
          {mark.mark.letter}
        </button>,
      )
    }
    for (const mark of mineSpans.filter((r) => r.end === to)) {
      chunks.push(
        <button
          key={`mine-${mark.mark.key}`}
          type="button"
          className="mine-mark"
          title={mark.mark.title}
          onClick={mark.mark.onOpen}
        >
          {mark.mark.glyph}
        </button>,
      )
    }
  }

  return <>{chunks}</>
}

function CardShell({
  x,
  y,
  label,
  onClose,
  children,
}: {
  x: number
  y: number
  label: string
  onClose: () => void
  children: ReactNode
}) {
  const card = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: Event) {
      if (card.current && !card.current.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onDoc)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onClose, true)
    return () => {
      document.removeEventListener('pointerdown', onDoc)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onClose, true)
    }
  }, [onClose])

  const left = Math.max(12, Math.min(x, window.innerWidth - 280))
  const top = Math.min(y + 8, window.innerHeight - 180)

  return (
    <div ref={card} className="strongs-card" role="dialog" aria-label={label} style={{ left, top }}>
      {children}
    </div>
  )
}

export function StrongsCard({
  hit,
  onClose,
  onThisVerse,
}: {
  hit: StrongsHit
  onClose: () => void
  onThisVerse: (verse: number) => void
}) {
  return (
    <CardShell x={hit.x} y={hit.y} label="Strong’s 1890 gloss" onClose={onClose}>
      <p className="strongs-num">
        {hit.entry.id} · {hit.entry.lemma}
      </p>
      <p className="strongs-word">{hit.word}</p>
      <p className="strongs-gloss">{hit.entry.gloss}</p>
      <p className="strongs-src">{STRONGS_SOURCE}</p>
      <button type="button" className="on-verse" onClick={() => onThisVerse(hit.verse)}>
        On this verse
      </button>
    </CardShell>
  )
}

export function DictCard({
  popup,
  onClose,
}: {
  popup: Extract<WordPopup, { kind: 'dict' }>
  onClose: () => void
}) {
  return (
    <CardShell x={popup.x} y={popup.y} label={popup.entry.name} onClose={onClose}>
      <p className="strongs-num">
        {popup.entry.source === 'Smith' ? 'Smith’s Bible Dictionary' : 'Easton’s Bible Dictionary, 1897'}
      </p>
      <p className="strongs-word">{popup.entry.name}</p>
      <p className="strongs-gloss">{popup.entry.body}</p>
      <p className="strongs-src">Public domain</p>
    </CardShell>
  )
}

export type { StrongsEntry }
