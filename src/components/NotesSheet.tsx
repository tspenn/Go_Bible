import { useState } from 'react'
import { Link } from '../App'
import { linkBodyBits, type DictEntry } from '../data/dictionary'
import { HENRY_SOURCE, type HenryNote } from '../data/henry'
import {
  isBookmarked,
  mineGlyph,
  penLabel,
  removeNote,
  toggleBookmark,
  useMarks,
  type UserNote,
} from '../data/marks'
import type { NaveHit } from '../data/naves'
import {
  formatTskRef,
  TSK_PREVIEW,
  TSK_SOURCE,
  tskHeading,
  tskHref,
  tskLinkCount,
  tskPreview,
  type TskGroup,
} from '../data/tsk'
import { ROBERTSON_SOURCE, type RobertsonNote } from '../data/robertson'
import {
  formatScofieldRef,
  SCOFIELD_SOURCE,
  scofieldBodyBits,
  scofieldHref,
  type ScofieldNote,
} from '../data/scofield'

export type SheetFocus = 'scofield' | 'henry' | 'tsk' | 'dictionary' | 'topics' | 'robertson' | 'mine' | null

export function NotesSheet({
  bookName,
  bookSlug,
  chapter,
  verse,
  scofield,
  henry,
  tsk,
  dict,
  topics,
  robertson,
  focus,
  highlightKey,
  onClose,
  onDictName,
  signedIn = false,
  mineNotes = [],
  mineFocusId,
}: {
  bookName: string
  bookSlug: string
  chapter: number
  verse: number
  scofield: (ScofieldNote & { key: string; letter: string })[]
  henry: HenryNote[]
  tsk: TskGroup[]
  dict: DictEntry[]
  topics: NaveHit[]
  robertson: (RobertsonNote & { key: string; letter: string })[]
  focus: SheetFocus
  highlightKey: string | null
  onClose: () => void
  onDictName?: (entry: DictEntry, x: number, y: number) => void
  signedIn?: boolean
  mineNotes?: UserNote[]
  mineFocusId?: string | null
}) {
  const marks = useMarks()
  const bookmarked = isBookmarked(bookSlug, chapter, verse)

  return (
    <aside className="notes-sheet" role="dialog" aria-label={`Notes on ${bookName} ${chapter}:${verse}`}>
      <div className="notes-sheet-bar">
        <h2>
          {bookName} {chapter}:{verse}
        </h2>
        <div className="notes-sheet-tools">
          {signedIn ? (
            <button
              type="button"
              className={`ribbon-btn${bookmarked ? ' on' : ''}`}
              aria-pressed={bookmarked}
              onClick={() => void toggleBookmark(bookSlug, chapter, verse)}
            >
              <span className="ribbon-icon" aria-hidden="true" />
              {bookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
          ) : (
            <Link className="ribbon-btn" to={`/login?next=${encodeURIComponent(`/bible/${bookSlug}/${chapter}/${verse}`)}`}>
              Sign in to bookmark
            </Link>
          )}
          <button type="button" className="notes-close" onClick={onClose} aria-label="Close notes">
            Close
          </button>
        </div>
      </div>

      {signedIn && (mineNotes.length > 0 || focus === 'mine') && (
        <section id="sheet-mine" className={focus === 'mine' ? 'note-on' : undefined}>
          <p className="source-line">My note</p>
          {mineNotes.length === 0 && (
            <p>Select two or more words in the verse, then choose Note.</p>
          )}
          {mineNotes.map((n, i) => (
            <div
              key={n.id}
              id={`mine-${n.id}`}
              className={mineFocusId === n.id || highlightKey === n.id ? 'note-on' : undefined}
            >
              <h3>
                <span className="mine-mark-label">{mineGlyph(i, mineNotes.length)}</span>
                {n.phrase ? ` “${n.phrase}”` : ''}
                {n.subject ? ` · ${n.subject}` : ''}
              </h3>
              <p>{n.text}</p>
              {n.color && (
                <p className="fine">Pen: {penLabel(n.color, marks.penNames)}</p>
              )}
              <button type="button" className="mark-back" onClick={() => void removeNote(n.id)}>
                Remove this note
              </button>
            </div>
          ))}
        </section>
      )}

      {scofield.length > 0 && (
      <section id="sheet-scofield" className={focus === 'scofield' ? 'note-on' : undefined}>
        <p className="source-line">{SCOFIELD_SOURCE}</p>
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
              <>
                <p className="see-also">
                  <Link to={scofieldHref(n.seeAlso[0])}>
                    Next in chain → {formatScofieldRef(n.seeAlso[0])}
                  </Link>
                </p>
                {n.seeAlso.length > 1 && (
                  <p className="see-also">
                    See also{' '}
                    {n.seeAlso.slice(1).map((ref, i) => (
                      <span key={`${ref.bookSlug}-${ref.chapter}-${ref.verse}`}>
                        {i > 0 ? '; ' : ''}
                        <Link to={scofieldHref(ref)}>{formatScofieldRef(ref)}</Link>
                      </span>
                    ))}
                    .
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </section>
      )}

      {henry.length > 0 && (
      <section id="sheet-henry" className={focus === 'henry' ? 'note-on' : undefined}>
        <p className="source-line">{HENRY_SOURCE}</p>
        {henry.map((n, ni) => (
          <div key={`${n.chapter}-${n.verse}-${n.range ?? ni}`}>
            <h3>
              {bookName} {n.chapter}:{n.verse}
              {n.range === 'intro'
                ? ' (introduction)'
                : n.range && n.range !== String(n.verse)
                  ? ` (on ${n.range})`
                  : ''}
            </h3>
            {n.body.split(/\n{2,}/).map((para, pi) => (
              <p key={pi}>
                {linkBodyBits(para, n.bookSlug, n.chapter).map((bit, i) => {
                  if (bit.type === 'ref') {
                    return (
                      <Link key={i} to={bit.href}>
                        {bit.text}
                      </Link>
                    )
                  }
                  if (bit.type === 'dict') {
                    return (
                      <button
                        key={i}
                        type="button"
                        className="dict-hit"
                        onClick={(e) => {
                          const box = e.currentTarget.getBoundingClientRect()
                          onDictName?.(bit.entry, box.left, box.bottom)
                        }}
                      >
                        {bit.text}
                      </button>
                    )
                  }
                  return <span key={i}>{bit.text}</span>
                })}
              </p>
            ))}
          </div>
        ))}
      </section>
      )}

      <TskSeeAlso key={`${bookSlug}-${chapter}-${verse}`} groups={tsk} focus={focus} />

      {dict.length > 0 && (
        <section id="sheet-dictionary" className={focus === 'dictionary' ? 'note-on' : undefined}>
          <p className="source-line">Easton’s Bible Dictionary, 1897, and Smith (public domain)</p>
          {dict.map((d) => (
            <div key={d.slug}>
              <h3>{d.name}</h3>
              <p>{d.body}</p>
              <p className="fine">{d.source === 'Smith' ? 'Smith’s Bible Dictionary' : 'Easton, 1897'}</p>
            </div>
          ))}
        </section>
      )}

      {topics.length > 0 && (
      <section id="sheet-topics" className={focus === 'topics' ? 'note-on' : undefined}>
        <p className="source-line">Nave’s Topical Bible, Orville J. Nave, 1896 (public domain).</p>
        <ul className="refs">
          {topics.map((t) => (
            <li key={t.slug}>
              <Link to={`/topics/${t.slug}`}>{t.name}</Link>
              {t.summary ? <span> — {t.summary}</span> : t.hitLabel ? <span> — {t.hitLabel}</span> : null}
            </li>
          ))}
        </ul>
      </section>
      )}

      {robertson.length > 0 && (
        <section id="sheet-robertson" className={focus === 'robertson' ? 'note-on' : undefined}>
          <p className="source-line">{ROBERTSON_SOURCE}</p>
          {robertson.map((n) => (
            <div
              key={n.key}
              id={`rwp-${n.letter}`}
              className={highlightKey === n.key ? 'note-on' : undefined}
            >
              <h3>
                <span className="callout-label rwp-callout">{n.letter}</span>
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

function TskSeeAlso({ groups, focus }: { groups: TskGroup[]; focus: SheetFocus }) {
  const [more, setMore] = useState(false)
  const total = tskLinkCount(groups)
  const shown = tskPreview(groups, more)
  if (total === 0) return null

  return (
    <section id="sheet-tsk" className={focus === 'tsk' ? 'note-on' : undefined}>
      <p className="source-line">{TSK_SOURCE}</p>
      {shown.map((g, gi) => (
        <div key={`${g.sortOrder}-${g.kjvPhrase}-${gi}`}>
          {tskHeading(g) ? <h3>{tskHeading(g)}</h3> : null}
          <ul className="refs tsk-refs">
            {g.refs.map((ref, i) => {
              const label = formatTskRef(ref)
              const go = `Go to ${label}`
              return (
                <li key={`${tskHref(ref)}-${i}`}>
                  <Link
                    className="tsk-go"
                    to={tskHref(ref)}
                    title={go}
                    aria-label={go}
                    data-go={go}
                  >
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
      {total > TSK_PREVIEW && !more && (
        <button type="button" className="mark-action tsk-more" onClick={() => setMore(true)}>
          More references
        </button>
      )}
    </section>
  )
}
