import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react'
import { dictForWord, type DictEntry } from '../data/dictionary'
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
  const ranges: { start: number; end: number; mark: ScoMark }[] = []
  for (const mark of scoMarks ?? []) {
    if (!mark.phrase) continue
    const escaped = mark.phrase.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
    const m = text.match(new RegExp(escaped, 'i'))
    if (!m || m.index == null) continue
    const start = m.index
    const end = m.index + m[0].length
    if (ranges.some((r) => start < r.end && end > r.start)) continue
    ranges.push({ start, end, mark })
  }
  ranges.sort((a, b) => a.start - b.start)

  if (ranges.length === 0) {
    return <WordBits text={text} verse={verse} dict={dict} onOpen={onOpen} rwpMarks={rwp} />
  }

  const chunks: ReactNode[] = []
  let at = 0
  ranges.forEach((range, i) => {
    if (range.start > at) {
      chunks.push(
        <WordBits
          key={`t${i}`}
          text={text.slice(at, range.start)}
          verse={verse}
          dict={dict}
          onOpen={onOpen}
          rwpMarks={rwp}
        />,
      )
    }
        const rwpHere = rwp.filter((m) =>
          new RegExp(`\\b${m.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(
            text.slice(range.start, range.end),
          ),
        )
        chunks.push(
          <span key={range.mark.key}>
            <button
              type="button"
              className="sco-phrase"
              title={range.mark.title}
              onClick={range.mark.onOpen}
            >
              {text.slice(range.start, range.end)}
            </button>
            <button
              type="button"
              className="callout"
              title={range.mark.title}
              onClick={range.mark.onOpen}
            >
              {range.mark.letter}
            </button>
            {rwpHere.map((m) => (
              <button key={`rwp-${m.letter}`} type="button" className="callout" title={m.title} onClick={m.onOpen}>
                {m.letter}
              </button>
            ))}
          </span>,
        )
    at = range.end
  })
  if (at < text.length) {
    chunks.push(
      <WordBits
        key="tail"
        text={text.slice(at)}
        verse={verse}
        dict={dict}
        onOpen={onOpen}
        rwpMarks={rwp}
      />,
    )
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
      <p className="strongs-num">Easton’s Bible Dictionary</p>
      <p className="strongs-word">{popup.entry.name}</p>
      <p className="strongs-gloss">{popup.entry.body}</p>
      <p className="strongs-src">Public domain</p>
    </CardShell>
  )
}

export type { StrongsEntry }
