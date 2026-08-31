import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, navigate } from '../App'
import { chapterCount, findVerse, SOURCE_LINE, versesInChapter } from '../data/kjv'
import { TOPICS } from '../data/naves'
import {
  markerLetter,
  noteKey,
  notesForChapter,
  type ScofieldNote,
} from '../data/scofield'
import { dictForVerse } from '../data/dictionary'
import { henryForChapter, henryForVerse, HENRY_SOURCE } from '../data/henry'
import {
  isRobertsonBook,
  noteByWord,
  notesForChapter as rwpForChapter,
  ROBERTSON_SOURCE,
  rwpKey,
  type RobertsonNote,
} from '../data/robertson'
import { StrongsCard, VerseWords } from '../components/StrongsGloss'
import type { StrongsHit } from '../data/strongs1890'
import { parseVerseQuery } from '../router'

type Tab = 'scripture' | 'notes' | 'henry' | 'dictionary' | 'topics' | 'robertson'

export function VersePage({
  bookSlug,
  chapter,
  verse,
  search = '',
  hash = '',
}: {
  bookSlug: string
  chapter: number
  verse?: number
  search?: string
  hash?: string
}) {
  const list = versesInChapter(bookSlug, chapter)
  const selected = verse ? findVerse(bookSlug, chapter, verse) : list[0]
  const focus = verse ?? selected?.verse
  const bookName = selected?.book ?? list[0]?.book ?? bookSlug
  const chapterNotes = notesForChapter(bookSlug, chapter)
  const marked = useMemo(
    () =>
      chapterNotes.map((n, i) => ({
        ...n,
        key: noteKey(n, i),
        letter: markerLetter(i),
      })),
    [chapterNotes],
  )
  const byVerse = useMemo(() => {
    const map = new Map<number, typeof marked>()
    for (const n of marked) {
      const arr = map.get(n.verse) ?? []
      arr.push(n)
      map.set(n.verse, arr)
    }
    return map
  }, [marked])

  const rwpChapter = useMemo(() => rwpForChapter(bookSlug, chapter), [bookSlug, chapter])
  const rwpMarked = useMemo(
    () =>
      rwpChapter.map((n, i) => ({
        ...n,
        key: rwpKey(n, i),
        letter: markerLetter(i),
      })),
    [rwpChapter],
  )
  const rwpByVerse = useMemo(() => {
    const map = new Map<number, typeof rwpMarked>()
    for (const n of rwpMarked) {
      const arr = map.get(n.verse) ?? []
      arr.push(n)
      map.set(n.verse, arr)
    }
    return map
  }, [rwpMarked])

  const totalChapters = chapterCount(bookSlug)
  const dict = focus ? dictForVerse(bookSlug, chapter, focus) : []
  const related = TOPICS.filter((t) =>
    t.refs.some((r) => r.toLowerCase().includes(bookName.toLowerCase())),
  )
  const query = parseVerseQuery(search, hash)
  const rwpBook = isRobertsonBook(bookSlug)

  const [tab, setTab] = useState<Tab>(() =>
    parseVerseQuery(search, hash).tab === 'robertson' ? 'robertson' : 'scripture',
  )
  const [openNote, setOpenNote] = useState<string | null>(null)
  const [openRwp, setOpenRwp] = useState<string | null>(null)
  const [strongs, setStrongs] = useState<StrongsHit | null>(null)
  const [henryVerse, setHenryVerse] = useState<number | null>(null)
  const closeStrongs = useCallback(() => setStrongs(null), [])
  const henryNotes = henryForChapter(bookSlug, chapter)
  const henryFocus = henryVerse ?? focus
  const henrySelected = henryFocus
    ? henryForVerse(bookSlug, chapter, henryFocus)
    : undefined

  const versePath =
    verse != null ? `/bible/${bookSlug}/${chapter}/${verse}` : `/bible/${bookSlug}/${chapter}`

  function setVerseTab(next: Tab) {
    setTab(next)
    const hasRwpQuery = query.tab === 'robertson'
    if (next === 'robertson') {
      navigate(`${versePath}?tab=robertson`)
      return
    }
    if (hasRwpQuery) navigate(versePath)
  }

  useEffect(() => {
    closeStrongs()
  }, [tab, bookSlug, chapter, closeStrongs])

  useEffect(() => {
    setHenryVerse(null)
  }, [bookSlug, chapter, verse])

  useEffect(() => {
    if (tab !== 'henry' || !henrySelected) return
    document.getElementById(`henry-${henrySelected.verse}`)?.scrollIntoView({ block: 'nearest' })
  }, [tab, henrySelected])

  useEffect(() => {
    if (query.tab === 'robertson') setTab('robertson')
  }, [query.tab])

  useEffect(() => {
    if (tab !== 'robertson') return
    let pick = query.rwpLetter
      ? rwpMarked.find((n) => n.letter === query.rwpLetter)
      : undefined
    if (!pick && query.w) {
      const byWord = noteByWord(bookSlug, chapter, query.w)
      pick = rwpMarked.find(
        (n) => n.verse === byWord?.verse && n.word?.toLowerCase() === query.w?.toLowerCase(),
      )
    }
    if (!pick && focus != null) pick = rwpByVerse.get(focus)?.[0]
    setOpenRwp(pick?.key ?? null)
    if (pick) {
      const id = `rwp-${pick.letter}`
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView({ block: 'nearest' }),
      )
    }
  }, [tab, query.rwpLetter, query.w, bookSlug, chapter, focus, rwpMarked, rwpByVerse])

  function openScofield(note: ScofieldNote & { key: string }) {
    setOpenNote(note.key)
    setVerseTab('notes')
  }

  function openHenry(nextVerse: number) {
    closeStrongs()
    setHenryVerse(nextVerse)
    setVerseTab('henry')
  }

  function openRobertson(note: RobertsonNote & { key: string; letter: string }) {
    setOpenRwp(note.key)
    setTab('robertson')
    const params = new URLSearchParams({ tab: 'robertson' })
    if (note.word) params.set('w', note.word)
    navigate(`/bible/${bookSlug}/${chapter}/${note.verse}?${params}#rwp-${note.letter}`)
  }

  if (!list.length && !selected) {
    return (
      <article className="page">
        <h1>Verse not in this seed yet</h1>
        <p className="lead">
          {bookSlug} {chapter}
          {verse ? `:${verse}` : ''} is not in the Go-Bible text.
        </p>
        <Link to="/bible">Back to Bible</Link>
      </article>
    )
  }

  return (
    <article className="page">
      <p className="eyebrow">Look Up</p>
      <h1>
        {bookName} {chapter}
        {focus ? `:${focus}` : ''}
      </h1>
      {totalChapters > 1 && (
        <nav className="chapter-index" aria-label="Chapters">
          {Array.from({ length: totalChapters }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              to={`/bible/${bookSlug}/${n}`}
              className={n === chapter ? 'on' : undefined}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}

      <div className="tabs" role="tablist">
        <button type="button" className={tab === 'scripture' ? 'on' : ''} onClick={() => setVerseTab('scripture')}>
          Scripture
        </button>
        <button type="button" className={tab === 'notes' ? 'on' : ''} onClick={() => setVerseTab('notes')}>
          Scofield
        </button>
        <button type="button" className={tab === 'henry' ? 'on' : ''} onClick={() => setVerseTab('henry')}>
          Henry
        </button>
        <button type="button" className={tab === 'dictionary' ? 'on' : ''} onClick={() => setVerseTab('dictionary')}>
          Dictionary
        </button>
        <button type="button" className={tab === 'topics' ? 'on' : ''} onClick={() => setVerseTab('topics')}>
          Topics
        </button>
        <button
          type="button"
          className={tab === 'robertson' ? 'on' : ''}
          title={ROBERTSON_SOURCE}
          aria-label={ROBERTSON_SOURCE}
          onClick={() => setVerseTab('robertson')}
        >
          Robertson
        </button>
      </div>

      {tab === 'scripture' && (
        <div className="chapter">
          <p className="source-line">
            {SOURCE_LINE} Small letters open 1917 Scofield notes.
            {rwpMarked.length > 0 ? ' Robertson letters open Word Pictures (1930).' : ''}
          </p>
          <p className="strongs-hint">Hold a word for Strong’s 1890.</p>
          {list.map((v) => {
            const marks = byVerse.get(v.verse) ?? []
            const rwpNotes = rwpByVerse.get(v.verse) ?? []
            const onWord = rwpNotes.filter(
              (n) =>
                n.word &&
                new RegExp(`\\b${n.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(
                  v.text,
                ),
            )
            const afterVerse = rwpNotes.filter((n) => !onWord.includes(n))
            return (
              <p
                key={v.verse}
                id={`v${v.verse}`}
                className={focus === v.verse ? 'highlight' : undefined}
              >
                <Link to={`/bible/${v.bookSlug}/${v.chapter}/${v.verse}`} className="vn">
                  {v.verse}
                </Link>{' '}
                <VerseWords
                  text={v.text}
                  verse={v.verse}
                  onOpen={setStrongs}
                  rwpMarks={onWord.map((n) => ({
                    word: n.word as string,
                    letter: n.letter,
                    title: n.heading ? `Robertson: ${n.heading}` : 'Robertson note',
                    onOpen: () => openRobertson(n),
                  }))}
                />
                {marks.map((n) => (
                  <button
                    key={n.key}
                    type="button"
                    className="callout"
                    title={n.heading ? `Scofield: ${n.heading}` : 'Scofield note'}
                    onClick={() => openScofield(n)}
                  >
                    {n.letter}
                  </button>
                ))}
                {afterVerse.map((n) => (
                  <button
                    key={n.key}
                    type="button"
                    className="callout"
                    title={n.heading ? `Robertson: ${n.heading}` : 'Robertson note'}
                    onClick={() => openRobertson(n)}
                  >
                    {n.letter}
                  </button>
                ))}
              </p>
            )
          })}
        </div>
      )}
      {tab === 'scripture' && strongs && (
        <StrongsCard
          key={`${strongs.entry.id}-${strongs.verse}`}
          hit={strongs}
          onClose={closeStrongs}
          onThisVerse={openHenry}
        />
      )}

      {tab === 'notes' && (
        <div className="panel">
          <p className="source-line">Scofield Reference Bible notes, 1917 (public domain)</p>
          {marked.length === 0 && <p>No 1917 Scofield note on this chapter in the seed set.</p>}
          {marked.map((n) => (
            <section
              key={n.key}
              id={`note-${n.key}`}
              className={openNote === n.key ? 'note-on' : undefined}
            >
              <h2>
                <span className="callout-label">{n.letter}</span> {bookName} {n.chapter}:{n.verse}
                {n.heading ? ` — ${n.heading}` : ''}
              </h2>
              <p>{n.body}</p>
            </section>
          ))}
        </div>
      )}

      {tab === 'henry' && (
        <div className="panel">
          <p className="source-line">{HENRY_SOURCE}</p>
          {henryNotes.length === 0 && (
            <p>No Matthew Henry note on this chapter in the seed set. Full complete commentary load is planned.</p>
          )}
          {henryNotes.length > 0 && henryVerse != null && !henrySelected && (
            <p>No Matthew Henry note on verse {henryVerse} in the seed set. Full complete commentary load is planned.</p>
          )}
          {henryNotes.map((n) => (
            <section
              key={`${n.bookSlug}-${n.chapter}-${n.verse}`}
              id={`henry-${n.verse}`}
              className={henrySelected?.verse === n.verse ? 'note-on' : undefined}
            >
              <h2>
                {bookName} {n.chapter}:{n.verse}
                {n.range && n.range !== String(n.verse) ? ` (on ${n.range})` : ''}
              </h2>
              <p>{n.body}</p>
            </section>
          ))}
        </div>
      )}

      {tab === 'dictionary' && (
        <div className="panel">
          <p className="source-line">Easton’s Bible Dictionary (public domain)</p>
          {dict.length === 0 && <p>No dictionary entry linked to this verse yet.</p>}
          {dict.map((d) => (
            <section key={d.slug}>
              <h2>{d.name}</h2>
              <p>{d.body}</p>
            </section>
          ))}
        </div>
      )}

      {tab === 'topics' && (
        <div className="panel">
          <p className="source-line">Nave’s Topical Bible (public domain)</p>
          {related.length === 0 && <p>No Nave’s topic linked yet.</p>}
          <ul className="refs">
            {related.map((t) => (
              <li key={t.slug}>
                <Link to={`/topics/${t.slug}`}>{t.name}</Link>
                <span> — {t.summary}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'robertson' && (
        <div className="panel">
          <p className="source-line">{ROBERTSON_SOURCE}</p>
          {!rwpBook && (
            <p>Robertson on this book will be added when those volumes are public domain.</p>
          )}
          {rwpBook && rwpMarked.length === 0 && (
            <p>No Robertson note on this chapter in the seed set.</p>
          )}
          {rwpBook &&
            rwpMarked.map((n) => (
              <section
                key={n.key}
                id={`rwp-${n.letter}`}
                className={openRwp === n.key ? 'note-on' : undefined}
              >
                <h2>
                  <span className="callout-label">{n.letter}</span> {bookName} {n.chapter}:{n.verse}
                  {n.heading ? ` — ${n.heading}` : ''}
                  {n.word ? ` (“${n.word}”)` : ''}
                </h2>
                <p>{n.body}</p>
              </section>
            ))}
        </div>
      )}
    </article>
  )
}
