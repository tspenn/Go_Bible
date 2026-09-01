import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react'
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

function ActivableWord({
  children,
  onActivate,
}: {
  children: ReactNode
  onActivate: (x: number, y: number) => void
}) {
  const timer = useRef<number>(0)
  const origin = useRef({ x: 0, y: 0 })
  const opened = useRef(false)

  function clear() {
    if (timer.current) {
      window.clearTimeout(timer.current)
      timer.current = 0
    }
  }

  function fire(target: HTMLElement) {
    opened.current = true
    window.getSelection()?.removeAllRanges()
    const box = target.getBoundingClientRect()
    onActivate(box.left, box.bottom)
  }

  function onPointerDown(e: PointerEvent<HTMLSpanElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    opened.current = false
    origin.current = { x: e.clientX, y: e.clientY }
    const target = e.currentTarget
    clear()
    timer.current = window.setTimeout(() => {
      timer.current = 0
      fire(target)
    }, HOLD_MS)
  }

  function onPointerMove(e: PointerEvent<HTMLSpanElement>) {
    if (!timer.current && !opened.current) return
    const dx = e.clientX - origin.current.x
    const dy = e.clientY - origin.current.y
    if (dx * dx + dy * dy > MOVE_PX * MOVE_PX) clear()
  }

  function onPointerUp(e: PointerEvent<HTMLSpanElement>) {
    const hadTimer = timer.current !== 0
    clear()
    if (opened.current) return
    const dx = e.clientX - origin.current.x
    const dy = e.clientY - origin.current.y
    if (dx * dx + dy * dy > MOVE_PX * MOVE_PX) return
    if (hadTimer || e.pointerType === 'mouse') fire(e.currentTarget)
  }

  return (
    <span
      className="word-hit"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={clear}
      onPointerLeave={clear}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </span>
  )
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
}: {
  text: string
  verse: number
  dict: DictEntry[]
  onOpen: (popup: WordPopup) => void
  rwpMarks: RwpMark[]
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

    if (peeled && (entry || dictHit)) {
      return (
        <span key={i}>
          <ActivableWord
            onActivate={(x, y) => {
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
          </ActivableWord>
          {letter}
        </span>
      )
    }
    return (
      <span key={i}>
        {bit}
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
}: {
  text: string
  verse: number
  dict: DictEntry[]
  onOpen: (popup: WordPopup) => void
  rwpMarks?: RwpMark[]
  scoMarks?: ScoMark[]
}) {
  const rwp = rwpMarks ?? []
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

  if (sco.length === 0 && names.length === 0) {
    return <WordBits text={text} verse={verse} dict={dict} onOpen={onOpen} rwpMarks={rwp} />
  }

  const cuts = new Set<number>([0, text.length])
  for (const r of sco) {
    cuts.add(r.start)
    cuts.add(r.end)
  }
  for (const r of names) {
    cuts.add(r.start)
    cuts.add(r.end)
  }
  for (const r of rwpSpans) {
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

    if (scoHere) {
      const className = dictHere ? 'sco-phrase dict-hit' : 'sco-phrase'
      chunks.push(
        <button
          key={`s${from}-${scoHere.mark.key}`}
          type="button"
          className={className}
          title={scoHere.mark.title}
          onClick={scoHere.mark.onOpen}
        >
          {slice}
        </button>,
      )
    } else if (dictHere) {
      chunks.push(
        <button
          key={`d${from}-${dictHere.entry.slug}`}
          type="button"
          className="dict-hit"
          title={dictHere.entry.name}
          onClick={(e) => {
            const box = e.currentTarget.getBoundingClientRect()
            onOpen({
              kind: 'dict',
              entry: dictHere.entry,
              word: slice,
              verse,
              x: box.left,
              y: box.bottom,
            })
          }}
        >
          {slice}
        </button>,
      )
    } else {
      chunks.push(
        <WordBits
          key={`t${from}`}
          text={slice}
          verse={verse}
          dict={dict}
          onOpen={onOpen}
          rwpMarks={[]}
        />,
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
