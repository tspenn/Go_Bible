import { useEffect, useRef, useState } from 'react'
import {
  addHighlight,
  addNote,
  isBookmarked,
  PEN_COLORS,
  penLabel,
  toggleBookmark,
  useMarks,
  type PenId,
} from '../data/marks'
import { Link } from '../App'

export type MarkRequest = {
  bookSlug: string
  chapter: number
  verse: number
  phrase: string
  x: number
  y: number
}

type Screen = 'choose' | 'highlight' | 'note'

export function SignInPrompt({
  x,
  y,
  onClose,
  next,
}: {
  x: number
  y: number
  onClose: () => void
  next: string
}) {
  const card = useRef<HTMLDivElement>(null)
  const left = Math.max(12, Math.min(x, window.innerWidth - 300))
  const top = Math.min(y + 8, window.innerHeight - 180)

  useEffect(() => {
    function onDoc(e: Event) {
      if (card.current && !card.current.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div ref={card} className="strongs-card mark-menu" role="dialog" aria-label="Sign in" style={{ left, top }}>
      <p className="strongs-num">Your marks</p>
      <p className="strongs-word">Sign in to highlight, bookmark, or add a note.</p>
      <Link className="mark-action" to={`/login?next=${encodeURIComponent(next)}`}>
        Sign in
      </Link>
    </div>
  )
}

export function MarkMenu({
  request,
  onClose,
  onSavedNote,
}: {
  request: MarkRequest
  onClose: () => void
  onSavedNote?: (noteId: string) => void
}) {
  const marks = useMarks()
  const card = useRef<HTMLDivElement>(null)
  const [screen, setScreen] = useState<Screen>('choose')
  const [phrase, setPhrase] = useState(request.phrase)
  const [text, setText] = useState('')
  const [subject, setSubject] = useState('')
  const [color, setColor] = useState<PenId | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const bookmarked = isBookmarked(request.bookSlug, request.chapter, request.verse)

  useEffect(() => {
    setPhrase(request.phrase)
    setScreen('choose')
    setText('')
    setSubject('')
    setColor(undefined)
  }, [request])

  useEffect(() => {
    function onDoc(e: Event) {
      if (card.current && !card.current.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const left = Math.max(12, Math.min(request.x, window.innerWidth - 300))
  const top = Math.min(request.y + 8, window.innerHeight - 280)

  function saveHighlight(id: PenId) {
    void addHighlight(request.bookSlug, request.chapter, request.verse, phrase, id)
    onClose()
  }

  async function saveNote() {
    if (saving) return
    setSaving(true)
    const entry = await addNote({
      bookSlug: request.bookSlug,
      chapter: request.chapter,
      verse: request.verse,
      phrase,
      text,
      color,
      subject,
    })
    if (entry?.color) {
      await addHighlight(request.bookSlug, request.chapter, request.verse, phrase, entry.color)
    }
    setSaving(false)
    if (entry) onSavedNote?.(entry.id)
    onClose()
  }

  return (
    <div ref={card} className="strongs-card mark-menu" role="dialog" aria-label="Your marks" style={{ left, top }}>
      {screen === 'choose' && (
        <>
          <p className="strongs-num">Your marks</p>
          <p className="strongs-word">{phrase || 'This verse'}</p>
          <div className="mark-actions">
            <button type="button" className="mark-action" onClick={() => setScreen('highlight')}>
              Highlight
            </button>
            <button
              type="button"
              className="mark-action"
              onClick={() => {
                void toggleBookmark(request.bookSlug, request.chapter, request.verse)
                onClose()
              }}
            >
              {bookmarked ? 'Remove bookmark' : 'Bookmark this verse'}
            </button>
            <button type="button" className="mark-action" onClick={() => setScreen('note')}>
              Add my note
            </button>
          </div>
        </>
      )}

      {screen === 'highlight' && (
        <>
          <p className="strongs-num">Highlight</p>
          <label className="mark-field">
            Phrase
            <input value={phrase} onChange={(e) => setPhrase(e.target.value)} />
          </label>
          <div className="pen-row" role="group" aria-label="Pens">
            {PEN_COLORS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="pen-swatch"
                style={{ background: p.wash }}
                aria-label={penLabel(p.id, marks.penNames)}
                onClick={() => saveHighlight(p.id)}
              >
                <span>{penLabel(p.id, marks.penNames)}</span>
              </button>
            ))}
          </div>
          <button type="button" className="mark-back" onClick={() => setScreen('choose')}>
            Back
          </button>
        </>
      )}

      {screen === 'note' && (
        <>
          <p className="strongs-num">My note</p>
          <label className="mark-field">
            Phrase
            <input value={phrase} onChange={(e) => setPhrase(e.target.value)} />
          </label>
          <label className="mark-field">
            Note
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} />
          </label>
          <label className="mark-field">
            Subject (optional)
            <input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>
          <p className="picker-step">Color (optional)</p>
          <div className="pen-row" role="group" aria-label="Optional color">
            {PEN_COLORS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`pen-swatch${color === p.id ? ' on' : ''}`}
                style={{ background: p.wash }}
                aria-pressed={color === p.id}
                aria-label={penLabel(p.id, marks.penNames)}
                onClick={() => setColor((c) => (c === p.id ? undefined : p.id))}
              >
                <span>{penLabel(p.id, marks.penNames)}</span>
              </button>
            ))}
          </div>
          <div className="mark-actions">
            <button
              type="button"
              className="mark-action"
              onClick={() => void saveNote()}
              disabled={saving || !phrase.trim() || !text.trim()}
            >
              Save note
            </button>
            <button type="button" className="mark-back" onClick={() => setScreen('choose')}>
              Back
            </button>
          </div>
        </>
      )}
    </div>
  )
}
