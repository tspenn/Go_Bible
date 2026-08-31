import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react'
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

function WordHit({
  children,
  entry,
  word,
  verse,
  onOpen,
}: {
  children: ReactNode
  entry: StrongsEntry
  word: string
  verse: number
  onOpen: (hit: StrongsHit) => void
}) {
  const timer = useRef<number>(0)
  const origin = useRef({ x: 0, y: 0 })

  function clear() {
    if (timer.current) {
      window.clearTimeout(timer.current)
      timer.current = 0
    }
  }

  function onPointerDown(e: PointerEvent<HTMLSpanElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    origin.current = { x: e.clientX, y: e.clientY }
    const target = e.currentTarget
    clear()
    timer.current = window.setTimeout(() => {
      timer.current = 0
      window.getSelection()?.removeAllRanges()
      const box = target.getBoundingClientRect()
      onOpen({
        entry,
        word,
        verse,
        x: box.left,
        y: box.bottom,
      })
    }, HOLD_MS)
  }

  function onPointerMove(e: PointerEvent<HTMLSpanElement>) {
    if (!timer.current) return
    const dx = e.clientX - origin.current.x
    const dy = e.clientY - origin.current.y
    if (dx * dx + dy * dy > MOVE_PX * MOVE_PX) clear()
  }

  return (
    <span
      className="word-hit"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={clear}
      onPointerCancel={clear}
      onPointerLeave={clear}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </span>
  )
}

export function VerseWords({
  text,
  verse,
  onOpen,
  rwpMarks,
}: {
  text: string
  verse: number
  onOpen: (hit: StrongsHit) => void
  rwpMarks?: { word: string; letter: string; title: string; onOpen: () => void }[]
}) {
  const leftover = [...(rwpMarks ?? [])]
  const bits = text.split(/(\s+)/)
  return bits.map((bit, i) => {
    if (!bit || /^\s+$/.test(bit)) return <span key={i}>{bit}</span>
    const peeled = peelToken(bit)
    const entry = peeled ? lookupStrongs(peeled.core) : undefined
    const markAt = peeled
      ? leftover.findIndex((m) => m.word.toLowerCase() === peeled.core.toLowerCase())
      : -1
    const mark = markAt >= 0 ? leftover.splice(markAt, 1)[0] : undefined
    const letter = mark ? (
      <button
        type="button"
        className="callout"
        title={mark.title}
        onClick={mark.onOpen}
      >
        {mark.letter}
      </button>
    ) : null
    if (peeled && entry) {
      return (
        <span key={i}>
          <WordHit entry={entry} word={peeled.core} verse={verse} onOpen={onOpen}>
            {bit}
          </WordHit>
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

export function StrongsCard({
  hit,
  onClose,
  onThisVerse,
}: {
  hit: StrongsHit
  onClose: () => void
  onThisVerse: (verse: number) => void
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

  const left = Math.max(12, Math.min(hit.x, window.innerWidth - 280))
  const top = Math.min(hit.y + 8, window.innerHeight - 180)

  return (
    <div
      ref={card}
      className="strongs-card"
      role="dialog"
      aria-label="Strong’s 1890 gloss"
      style={{ left, top }}
    >
      <p className="strongs-num">
        {hit.entry.id} · {hit.entry.lemma}
      </p>
      <p className="strongs-word">{hit.word}</p>
      <p className="strongs-gloss">{hit.entry.gloss}</p>
      <p className="strongs-src">{STRONGS_SOURCE}</p>
      <button type="button" className="on-verse" onClick={() => onThisVerse(hit.verse)}>
        On this verse
      </button>
    </div>
  )
}
