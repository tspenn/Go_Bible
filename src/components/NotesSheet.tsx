import { Link } from '../App'
import type { DictEntry } from '../data/dictionary'
import { HENRY_SOURCE, type HenryNote } from '../data/henry'
import type { NaveTopic } from '../data/naves'
import {
  isRobertsonBook,
  ROBERTSON_SOURCE,
  type RobertsonNote,
} from '../data/robertson'
import {
  formatScofieldRef,
  scofieldBodyBits,
  scofieldHref,
  type ScofieldNote,
} from '../data/scofield'

export type SheetFocus = 'scofield' | 'henry' | 'dictionary' | 'topics' | 'robertson' | null

export function NotesSheet({
  bookName,
  bookSlug,
  chapter,
  verse,
  scofield,
  henry,
  dict,
  topics,
  robertson,
  focus,
  highlightKey,
  onClose,
}: {
  bookName: string
  bookSlug: string
  chapter: number
  verse: number
  scofield: (ScofieldNote & { key: string; letter: string })[]
  henry: HenryNote | undefined
  dict: DictEntry[]
  topics: NaveTopic[]
  robertson: (RobertsonNote & { key: string; letter: string })[]
  focus: SheetFocus
  highlightKey: string | null
  onClose: () => void
}) {
  const rwpBook = isRobertsonBook(bookSlug)
  const showRwp = robertson.length > 0 || focus === 'robertson'

  return (
    <aside className="notes-sheet" role="dialog" aria-label={`Notes on ${bookName} ${chapter}:${verse}`}>
      <div className="notes-sheet-bar">
        <h2>
          {bookName} {chapter}:{verse}
        </h2>
        <button type="button" className="notes-close" onClick={onClose} aria-label="Close notes">
          Close
        </button>
      </div>

      <section id="sheet-scofield" className={focus === 'scofield' ? 'note-on' : undefined}>
        <p className="source-line">Scofield Reference Bible notes, 1917 (public domain)</p>
        {scofield.length === 0 && <p>No 1917 Scofield note on this verse.</p>}
        {scofield.map((n) => (
          <div key={n.key} id={`note-${n.key}`} className={highlightKey === n.key ? 'note-on' : undefined}>
            <h3>
              <span className="callout-label">{n.letter}</span>
              {n.heading ? ` ${n.heading}` : ''}
            </h3>
            <p>
              {scofieldBodyBits(n.body, n.bookSlug, n.chapter).map((bit, i) =>
                bit.type === 'ref' ? (
                  <Link key={i} to={bit.href}>
                    {bit.text}
                  </Link>
                ) : (
                  <span key={i}>{bit.text}</span>
                ),
              )}
            </p>
            {n.seeAlso.length > 0 && (
              <p className="see-also">
                See also{' '}
                {n.seeAlso.map((ref, i) => (
                  <span key={`${ref.bookSlug}-${ref.chapter}-${ref.verse}`}>
                    {i > 0 ? '; ' : ''}
                    <Link to={scofieldHref(ref)}>{formatScofieldRef(ref)}</Link>
                  </span>
                ))}
                .
              </p>
            )}
          </div>
        ))}
      </section>

      <section id="sheet-henry" className={focus === 'henry' ? 'note-on' : undefined}>
        <p className="source-line">{HENRY_SOURCE}</p>
        {henry ? (
          <>
            <h3>
              {bookName} {henry.chapter}:{henry.verse}
              {henry.range && henry.range !== String(henry.verse) ? ` (on ${henry.range})` : ''}
            </h3>
            <p>{henry.body}</p>
          </>
        ) : (
          <p>Henry coming</p>
        )}
      </section>

      {dict.length > 0 && (
        <section id="sheet-dictionary" className={focus === 'dictionary' ? 'note-on' : undefined}>
          <p className="source-line">Easton’s Bible Dictionary (public domain)</p>
          {dict.map((d) => (
            <div key={d.slug}>
              <h3>{d.name}</h3>
              <p>{d.body}</p>
            </div>
          ))}
        </section>
      )}

      <section id="sheet-topics" className={focus === 'topics' ? 'note-on' : undefined}>
        <p className="source-line">Nave’s Topical Bible (public domain)</p>
        {topics.length === 0 && <p>No Nave’s topic linked to this verse yet.</p>}
        {topics.length > 0 && (
          <ul className="refs">
            {topics.map((t) => (
              <li key={t.slug}>
                <Link to={`/topics/${t.slug}`}>{t.name}</Link>
                <span> — {t.summary}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showRwp && (
        <section id="sheet-robertson" className={focus === 'robertson' ? 'note-on' : undefined}>
          <p className="source-line">{ROBERTSON_SOURCE}</p>
          {!rwpBook && (
            <p>Robertson on this book will be added when those volumes are public domain.</p>
          )}
          {rwpBook && robertson.length === 0 && <p>No Robertson note on this verse in the seed set.</p>}
          {robertson.map((n) => (
            <div
              key={n.key}
              id={`rwp-${n.letter}`}
              className={highlightKey === n.key ? 'note-on' : undefined}
            >
              <h3>
                <span className="callout-label">{n.letter}</span>
                {n.heading ? ` ${n.heading}` : ''}
                {n.word ? ` (“${n.word}”)` : ''}
              </h3>
              <p>{n.body}</p>
            </div>
          ))}
        </section>
      )}
    </aside>
  )
}
