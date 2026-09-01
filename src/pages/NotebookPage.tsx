import { useState } from 'react'
import { Link } from '../App'
import {
  bookmarkHref,
  formatMarkRef,
  highlightHref,
  noteHref,
  penLabel,
  removeHighlight,
  removeNote,
  toggleBookmark,
  useMarks,
} from '../data/marks'
import { useAuth } from '../lib/auth'

export function NotebookPage() {
  const { ready, user } = useAuth()
  const marks = useMarks()
  const [busy, setBusy] = useState<'text' | 'word' | null>(null)
  const [exportError, setExportError] = useState('')
  const subjects = [...new Set(marks.notes.map((n) => n.subject).filter(Boolean) as string[])].sort(
    (a, b) => a.localeCompare(b),
  )
  const canExport =
    marks.notes.length > 0 || marks.highlights.length > 0 || marks.bookmarks.length > 0

  async function exportLesson(kind: 'text' | 'word') {
    if (!canExport || busy) return
    setBusy(kind)
    setExportError('')
    try {
      if (kind === 'text') {
        const { downloadLessonText } = await import('../lib/exportNotebook')
        await downloadLessonText(marks)
      } else {
        const { downloadLessonWord } = await import('../lib/exportNotebookDocx')
        await downloadLessonWord(marks)
      }
    } catch {
      setExportError('Could not prepare the file. Try again.')
    } finally {
      setBusy(null)
    }
  }

  if (!ready) {
    return (
      <article className="page">
        <h1>Notebook</h1>
        <p className="lead">Loading your marks…</p>
      </article>
    )
  }

  if (!user) {
    return (
      <article className="page">
        <h1>Notebook</h1>
        <p className="lead">Sign in to see bookmarks, highlights, and notes that belong to you.</p>
        <p>
          <Link to="/login?next=/notebook">Sign in</Link>
        </p>
      </article>
    )
  }

  return (
    <article className="page">
      <h1>Notebook</h1>
      <p className="lead">Bookmarks, highlights, and notes on your account. No one else can see them.</p>
      <p className="export-row">
        <button
          type="button"
          className="mark-action"
          disabled={!canExport || busy !== null}
          onClick={() => void exportLesson('text')}
        >
          {busy === 'text' ? 'Preparing…' : 'Download text'}
        </button>
        <button
          type="button"
          className="mark-action"
          disabled={!canExport || busy !== null}
          onClick={() => void exportLesson('word')}
        >
          {busy === 'word' ? 'Preparing…' : 'Download Word'}
        </button>
      </p>
      <p className="fine">
        A Sunday School file with the verses, the words you marked, and your notes. Word opens the
        .docx; any editor opens the .txt.
      </p>
      {exportError ? <p className="fine">{exportError}</p> : null}

      <h2>Bookmarks</h2>
      {marks.bookmarks.length === 0 && (
        <p>No bookmarks yet. Open a verse and tap the ribbon, or press and hold a word.</p>
      )}
      <ul className="topic-list">
        {marks.bookmarks
          .slice()
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((b) => (
            <li key={b.id}>
              <Link to={bookmarkHref(b)}>
                <span className="ribbon-icon inline" aria-hidden="true" />
                {formatMarkRef(b.bookSlug, b.chapter, b.verse)}
              </Link>
              <button
                type="button"
                className="mark-back"
                onClick={() => void toggleBookmark(b.bookSlug, b.chapter, b.verse)}
              >
                Remove
              </button>
            </li>
          ))}
      </ul>

      <h2>Highlights by pen</h2>
      {marks.highlights.length === 0 && (
        <p>No highlights yet. Select two or more words, then choose Highlight.</p>
      )}
      {['yellow', 'gold', 'orange', 'pink', 'rose', 'sage', 'teal', 'dusty-blue', 'lavender', 'gray'].map(
        (id) => {
          const rows = marks.highlights.filter((h) => h.color === id)
          if (rows.length === 0) return null
          const label = penLabel(id as (typeof rows)[0]['color'], marks.penNames)
          return (
            <div key={id}>
              <h3 className="pen-heading">{label}</h3>
              <ul className="topic-list">
                {rows.map((h) => (
                  <li key={h.id}>
                    <Link to={highlightHref(h)}>
                      {formatMarkRef(h.bookSlug, h.chapter, h.verse)} — “{h.phrase}”
                    </Link>
                    <button type="button" className="mark-back" onClick={() => void removeHighlight(h.id)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        },
      )}

      <h2>Subjects</h2>
      {subjects.length === 0 && <p>No subjects yet. Add an optional subject when you save a note.</p>}
      {subjects.map((subject) => (
        <div key={subject}>
          <h3 className="pen-heading">{subject}</h3>
          <ul className="topic-list">
            {marks.notes
              .filter((n) => n.subject === subject)
              .map((n) => (
                <li key={n.id}>
                  <Link to={noteHref(n)}>
                    {formatMarkRef(n.bookSlug, n.chapter, n.verse)} — “{n.phrase}”
                  </Link>
                  <span>{n.text}</span>
                  <button type="button" className="mark-back" onClick={() => void removeNote(n.id)}>
                    Remove
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ))}

      {marks.notes.some((n) => !n.subject) && (
        <>
          <h2>Notes without a subject</h2>
          <ul className="topic-list">
            {marks.notes
              .filter((n) => !n.subject)
              .map((n) => (
                <li key={n.id}>
                  <Link to={noteHref(n)}>
                    {formatMarkRef(n.bookSlug, n.chapter, n.verse)} — “{n.phrase}”
                  </Link>
                  <span>{n.text}</span>
                  <button type="button" className="mark-back" onClick={() => void removeNote(n.id)}>
                    Remove
                  </button>
                </li>
              ))}
          </ul>
        </>
      )}
    </article>
  )
}
