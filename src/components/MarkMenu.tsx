import { useEffect, useRef, useState } from 'react'
import { Link } from '../App'
import { linkBodyBits } from '../data/dictionary'
import { HENRY_SOURCE, type HenryNote } from '../data/henry'
import {
  addHighlight,
  addNote,
  PEN_COLORS,
  penLabel,
  useMarks,
  type PenId,
} from '../data/marks'
import {
  citation,
  copyText,
  quoteForShare,
  shareQuote,
  type LiveWash,
} from '../lib/textSelect'

export type MarkRequest = {
  bookSlug: string
  bookName: string
  chapter: number
  verse: number
  verses: number[]
  phrase: string
  washes: LiveWash[]
  x: number
  y: number
}

type Screen = 'choose' | 'highlight' | 'note' | 'commentary'

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
      <p className="strongs-word">Sign in to highlight or add a note.</p>
      <Link className="mark-action" to={`/login?next=${encodeURIComponent(next)}`}>
        Sign in
      </Link>
    </div>
  )
}

export function MarkMenu({
  request,
  signedIn,
  henry,
  onClose,
  onSavedNote,
  onNeedSignIn,
}: {
  request: MarkRequest
  signedIn: boolean
  henry: HenryNote[]
  onClose: () => void
  onSavedNote?: (noteId: string) => void
  onNeedSignIn: () => void
}) {
  const marks = useMarks()
  const card = useRef<HTMLDivElement>(null)
  const [screen, setScreen] = useState<Screen>('choose')
  const [phrase, setPhrase] = useState(request.phrase)
  const [text, setText] = useState('')
  const [subject, setSubject] = useState('')
  const [color, setColor] = useState<PenId | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareNote, setShareNote] = useState<string | null>(null)
  const refLabel = citation(request.bookName, request.chapter, request.verses)
  const quoted = quoteForShare(request.bookName, request.chapter, request.verses, phrase || request.phrase)
  const verseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/bible/${request.bookSlug}/${request.chapter}/${request.verse}`
      : `/bible/${request.bookSlug}/${request.chapter}/${request.verse}`

  useEffect(() => {
    setPhrase(request.phrase)
    setScreen('choose')
    setText('')
    setSubject('')
    setColor(undefined)
    setCopied(false)
    setShareNote(null)
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
  const top = Math.min(request.y + 8, window.innerHeight - (screen === 'commentary' ? 360 : 280))

  function saveHighlight(id: PenId) {
    const rows = request.washes.length > 0 ? request.washes : [{ verse: request.verse, phrase }]
    for (const row of rows) {
      void addHighlight(request.bookSlug, request.chapter, row.verse, row.phrase, id)
    }
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

  async function onCopy() {
    await copyText(`${quoted}\n${verseUrl}`)
    setCopied(true)
  }

  async function onShare() {
    const result = await shareQuote({ title: refLabel, text: quoted, url: verseUrl })
    if (result === 'copied') setShareNote('Copied to paste elsewhere')
    if (result === 'shared') onClose()
  }

  function askMark(next: Screen) {
    if (!signedIn) {
      onNeedSignIn()
      return
    }
    setScreen(next)
  }

  return (
    <div
      ref={card}
      className={`strongs-card mark-menu${screen === 'commentary' ? ' commentary-card' : ''}`}
      role="dialog"
      aria-label="Selected text"
      style={{ left, top }}
    >
      {screen === 'choose' && (
        <>
          <p className="strongs-num">{refLabel}</p>
          <p className="strongs-word">{phrase || 'This verse'}</p>
          <div className="mark-actions">
            <button type="button" className="mark-action" onClick={() => askMark('highlight')}>
              Highlight
            </button>
            <button type="button" className="mark-action" onClick={() => void onShare()}>
              Share
            </button>
            <button type="button" className="mark-action" onClick={() => askMark('note')}>
              Note
            </button>
            {henry.length > 0 && (
              <button type="button" className="mark-action" onClick={() => setScreen('commentary')}>
                See Commentary
              </button>
            )}
            <button type="button" className="mark-action" onClick={() => void onCopy()}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          {shareNote && <p className="fine">{shareNote}</p>}
        </>
      )}

      {screen === 'highlight' && (
        <>
          <p className="strongs-num">Highlight</p>
          <p className="strongs-word">{phrase}</p>
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

      {screen === 'commentary' && (
        <>
          <p className="strongs-num">{HENRY_SOURCE}</p>
          {henry.map((n, ni) => (
            <div key={`${n.chapter}-${n.verse}-${n.range ?? ni}`}>
              <p className="strongs-word">
                {request.bookName} {n.chapter}:{n.verse}
                {n.range === 'intro'
                  ? ' (introduction)'
                  : n.range && n.range !== String(n.verse)
                    ? ` (on ${n.range})`
                    : ''}
              </p>
              {n.body.split(/\n{2,}/).map((para, pi) => (
                <p key={pi} className="strongs-gloss">
                  {linkBodyBits(para, n.bookSlug, n.chapter).map((bit, i) =>
                    bit.type === 'ref' ? (
                      <Link key={i} to={bit.href}>
                        {bit.text}
                      </Link>
                    ) : (
                      <span key={i}>{bit.text}</span>
                    ),
                  )}
                </p>
              ))}
            </div>
          ))}
          <button type="button" className="mark-back" onClick={() => setScreen('choose')}>
            Back
          </button>
        </>
      )}
    </div>
  )
}
