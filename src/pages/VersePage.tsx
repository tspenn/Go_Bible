import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, navigate } from '../App'
import { findVerse, SOURCE_LINE, versesInChapter } from '../data/kjv'
import { topicsForVerse } from '../data/naves'
import { markerLetter, noteKey, notesForChapter, phraseSpan, ensureScofieldBook, useScofield } from '../data/scofield'
import { dictForVerse } from '../data/dictionary'
import {
  attachHenryPhrase,
  ensureHenryBook,
  henryNotesForVerse,
  useHenry,
} from '../data/henry'
import {
  noteByWord,
  notesForChapter as rwpForChapter,
  rwpKey,
  type RobertsonNote,
} from '../data/robertson'
import { BookPicker } from '../components/BookPicker'
import { MarkMenu, SignInPrompt, type MarkRequest } from '../components/MarkMenu'
import { NotesSheet, type SheetFocus } from '../components/NotesSheet'
import { DictCard, StrongsCard, VerseWords, type WordPopup } from '../components/StrongsGloss'
import { mineGlyph, notesForVerse, useMarks, washesForVerse, type UserNote } from '../data/marks'
import { tskForVerse, ensureTskBook, useTsk } from '../data/tsk'
import { useAuth } from '../lib/auth'
import { parseVerseQuery } from '../router'

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
  const { user } = useAuth()
  const marks = useMarks()
  useTsk()
  useScofield()
  useHenry()
  useEffect(() => {
    void ensureTskBook(bookSlug)
    void ensureScofieldBook(bookSlug)
    void ensureHenryBook(bookSlug)
  }, [bookSlug])
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

  const query = parseVerseQuery(search, hash)

  const sheetVerse = verse ?? focus
  const [sheetOpen, setSheetOpen] = useState(
    () =>
      verse != null ||
      parseVerseQuery(search, hash).tab === 'robertson' ||
      parseVerseQuery(search, hash).tab === 'scofield' ||
      parseVerseQuery(search, hash).tab === 'henry' ||
      parseVerseQuery(search, hash).tab === 'mine',
  )
  const [sheetFocus, setSheetFocus] = useState<SheetFocus>(() => {
    const tab = parseVerseQuery(search, hash).tab
    if (tab === 'robertson') return 'robertson'
    if (tab === 'scofield') return 'scofield'
    if (tab === 'henry') return 'henry'
    if (tab === 'mine') return 'mine'
    return null
  })
  const [highlightKey, setHighlightKey] = useState<string | null>(null)
  const [wordPopup, setWordPopup] = useState<WordPopup | null>(null)
  const [markRequest, setMarkRequest] = useState<MarkRequest | null>(null)
  const [signInAsk, setSignInAsk] = useState<{ x: number; y: number } | null>(null)
  const closeWord = useCallback(() => setWordPopup(null), [])

  useEffect(() => {
    if (!sheetOpen || !sheetFocus) return
    const id =
      sheetFocus === 'robertson' && highlightKey
        ? `rwp-${rwpMarked.find((n) => n.key === highlightKey)?.letter ?? ''}`
        : sheetFocus === 'scofield' && highlightKey
          ? `note-${highlightKey}`
          : sheetFocus === 'mine' && highlightKey
            ? `mine-${highlightKey}`
            : `sheet-${sheetFocus}`
    if (!id || id.endsWith('-')) return
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'nearest' }))
  }, [sheetOpen, sheetFocus, highlightKey, rwpMarked])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !wordPopup) closeSheet()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [wordPopup, sheetOpen])

  useEffect(() => {
    closeWord()
  }, [bookSlug, chapter, closeWord])

  useEffect(() => {
    if (
      verse != null ||
      query.tab === 'robertson' ||
      query.tab === 'scofield' ||
      query.tab === 'henry' ||
      query.tab === 'mine'
    ) {
      setSheetOpen(true)
      if (query.tab === 'robertson') setSheetFocus('robertson')
      else if (query.tab === 'scofield') setSheetFocus('scofield')
      else if (query.tab === 'henry') setSheetFocus('henry')
      else if (query.tab === 'mine' && user) setSheetFocus('mine')
    } else {
      setSheetOpen(false)
    }
  }, [bookSlug, chapter, verse, query.tab, user])

  useEffect(() => {
    if (!sheetOpen || query.tab !== 'mine' || !user) return
    setHighlightKey(query.note ?? query.highlight ?? null)
  }, [sheetOpen, query.tab, query.note, query.highlight, user])

  useEffect(() => {
    if (!sheetOpen || query.tab !== 'robertson') return
    let pick = query.rwpLetter
      ? rwpMarked.find((n) => n.letter === query.rwpLetter)
      : undefined
    if (!pick && query.w) {
      const byWord = noteByWord(bookSlug, chapter, query.w)
      pick = rwpMarked.find(
        (n) => n.verse === byWord?.verse && n.word?.toLowerCase() === query.w?.toLowerCase(),
      )
    }
    if (!pick && sheetVerse != null) pick = rwpByVerse.get(sheetVerse)?.[0]
    setHighlightKey(pick?.key ?? null)
    if (pick) {
      const id = `rwp-${pick.letter}`
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView({ block: 'nearest' }),
      )
    }
  }, [
    sheetOpen,
    query.rwpLetter,
    query.w,
    query.tab,
    bookSlug,
    chapter,
    sheetVerse,
    rwpMarked,
    rwpByVerse,
  ])

  useEffect(() => {
    if (!sheetOpen || query.tab !== 'scofield') return
    const onVerse = sheetVerse != null ? (byVerse.get(sheetVerse) ?? []) : []
    setHighlightKey((current) => {
      if (current && onVerse.some((n) => n.key === current)) return current
      return onVerse[0]?.key ?? null
    })
  }, [sheetOpen, query.tab, sheetVerse, byVerse])

  function openRobertson(note: RobertsonNote & { key: string; letter: string }) {
    closeWord()
    setSheetFocus('robertson')
    setHighlightKey(note.key)
    setSheetOpen(true)
    const params = new URLSearchParams({ tab: 'robertson' })
    if (note.word) params.set('w', note.word)
    navigate(`/bible/${bookSlug}/${chapter}/${note.verse}?${params}#rwp-${note.letter}`)
  }

  function openScofield(note: (typeof marked)[number]) {
    closeWord()
    setSheetFocus('scofield')
    setHighlightKey(note.key)
    setSheetOpen(true)
    navigate(`/bible/${bookSlug}/${chapter}/${note.verse}?tab=scofield`)
  }

  function openHenry(nextVerse: number) {
    closeWord()
    setSheetFocus('henry')
    setHighlightKey(null)
    setSheetOpen(true)
    navigate(`/bible/${bookSlug}/${chapter}/${nextVerse}?tab=henry`)
  }

  function openMine(note: UserNote) {
    closeWord()
    setMarkRequest(null)
    setSignInAsk(null)
    setSheetFocus('mine')
    setHighlightKey(note.id)
    setSheetOpen(true)
    navigate(`/bible/${bookSlug}/${chapter}/${note.verse}?tab=mine&note=${note.id}`)
  }

  function closeSheet() {
    closeWord()
    setSheetOpen(false)
    setSheetFocus(null)
    setHighlightKey(null)
    if (
      verse != null ||
      query.tab === 'robertson' ||
      query.tab === 'scofield' ||
      query.tab === 'henry' ||
      query.tab === 'mine'
    ) {
      navigate(`/bible/${bookSlug}/${chapter}`)
    }
  }

  function onThisVerse(nextVerse: number) {
    closeWord()
    setSheetFocus(null)
    setHighlightKey(null)
    setSheetOpen(true)
    if (verse !== nextVerse) navigate(`/bible/${bookSlug}/${chapter}/${nextVerse}`)
  }

  const sheetNotes = sheetVerse != null ? (byVerse.get(sheetVerse) ?? []) : []
  const sheetHenry = sheetVerse != null ? henryNotesForVerse(bookSlug, chapter, sheetVerse) : []
  const sheetDict = sheetVerse != null ? dictForVerse(bookSlug, chapter, sheetVerse) : []
  const sheetTopics = sheetVerse != null ? topicsForVerse(bookSlug, chapter, sheetVerse) : []
  const sheetTsk = sheetVerse != null ? tskForVerse(bookSlug, chapter, sheetVerse) : []
  const sheetRwp = sheetVerse != null ? (rwpByVerse.get(sheetVerse) ?? []) : []
  const sheetMine =
    user && sheetVerse != null
      ? marks.notes
          .filter((n) => n.bookSlug === bookSlug && n.chapter === chapter && n.verse === sheetVerse)
          .sort((a, b) => a.createdAt - b.createdAt)
      : []

  function onMark(verseNum: number, phrase: string, x: number, y: number) {
    closeWord()
    if (!user) {
      setMarkRequest(null)
      setSignInAsk({ x, y })
      return
    }
    setSignInAsk(null)
    setMarkRequest({ bookSlug, chapter, verse: verseNum, phrase, x, y })
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
    <article className={`page reading${sheetOpen ? ' with-notes' : ''}`}>
      <div className="reader">
        <BookPicker selectedBook={bookSlug} selectedChapter={chapter} />
        <h1>
          {bookName} {chapter}
        </h1>

        <div className="chapter">
          <p className="source-line">
            {SOURCE_LINE} Verse numbers open notes. Small letters open Scofield or Robertson.
          </p>
          {list.map((v) => {
            const marksOnVerse = byVerse.get(v.verse) ?? []
            const rwpNotes = rwpByVerse.get(v.verse) ?? []
            const onWord = rwpNotes.filter(
              (n) =>
                n.word &&
                new RegExp(`\\b${n.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(
                  v.text,
                ),
            )
            const afterVerse = rwpNotes.filter((n) => !onWord.includes(n))
            const dict = dictForVerse(bookSlug, chapter, v.verse)
            const henryPhrase = attachHenryPhrase(bookSlug, chapter, v.verse)
            const scoOnPhrase = marksOnVerse.filter((n) => n.webPhrase && phraseSpan(v.text, n.webPhrase))
            const scoVerseLevel = marksOnVerse.filter((n) => !n.webPhrase || !phraseSpan(v.text, n.webPhrase))
            const mineNotes = user ? notesForVerse(bookSlug, chapter, v.verse) : []
            const washes = user ? washesForVerse(bookSlug, chapter, v.verse) : []
            return (
              <p
                key={v.verse}
                id={`v${v.verse}`}
                className={focus === v.verse && verse != null ? 'highlight' : undefined}
              >
                <Link
                  to={`/bible/${v.bookSlug}/${v.chapter}/${v.verse}`}
                  className="vn"
                  onClick={closeWord}
                >
                  {v.verse}
                </Link>{' '}
                <VerseWords
                  text={v.text}
                  verse={v.verse}
                  dict={dict}
                  onOpen={setWordPopup}
                  rwpMarks={onWord.map((n) => ({
                    word: n.word as string,
                    letter: n.letter,
                    title: n.heading ? `Robertson: ${n.heading}` : 'Robertson note',
                    onOpen: () => openRobertson(n),
                  }))}
                  scoMarks={scoOnPhrase.map((n) => ({
                    phrase: n.webPhrase,
                    letter: n.letter,
                    title: n.heading ? `Scofield: ${n.heading}` : 'Scofield note',
                    onOpen: () => openScofield(n),
                    key: n.key,
                  }))}
                  henryMarks={
                    henryPhrase
                      ? [
                          {
                            phrase: henryPhrase,
                            title: 'Matthew Henry',
                            onOpen: () => openHenry(v.verse),
                            key: `henry-${v.verse}`,
                          },
                        ]
                      : []
                  }
                  washes={washes}
                  mineMarks={mineNotes.map((n, i) => ({
                    phrase: n.phrase,
                    glyph: mineGlyph(i, mineNotes.length),
                    title: n.subject ? `My note: ${n.subject}` : 'My note',
                    onOpen: () => openMine(n),
                    key: n.id,
                  }))}
                  onMark={(phrase, x, y) => onMark(v.verse, phrase, x, y)}
                />
                {scoVerseLevel.map((n) => (
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
      </div>

      {wordPopup?.kind === 'strongs' && (
        <StrongsCard
          key={`${wordPopup.hit.entry.id}-${wordPopup.hit.verse}`}
          hit={wordPopup.hit}
          onClose={closeWord}
          onThisVerse={onThisVerse}
        />
      )}
      {wordPopup?.kind === 'dict' && <DictCard popup={wordPopup} onClose={closeWord} />}

      {markRequest && (
        <MarkMenu
          request={markRequest}
          onClose={() => setMarkRequest(null)}
          onSavedNote={(noteId) => {
            const note = notesForVerse(markRequest.bookSlug, markRequest.chapter, markRequest.verse).find(
              (n) => n.id === noteId,
            )
            if (note) openMine(note)
          }}
        />
      )}
      {signInAsk && (
        <SignInPrompt
          x={signInAsk.x}
          y={signInAsk.y}
          onClose={() => setSignInAsk(null)}
          next={`/bible/${bookSlug}/${chapter}${focus ? `/${focus}` : ''}`}
        />
      )}

      {sheetOpen && sheetVerse != null && (
        <>
          <button type="button" className="notes-backdrop" aria-label="Close notes" onClick={closeSheet} />
          <NotesSheet
            bookName={bookName}
            bookSlug={bookSlug}
            chapter={chapter}
            verse={sheetVerse}
            scofield={sheetNotes}
            henry={sheetHenry}
            tsk={sheetTsk}
            dict={sheetDict}
            topics={sheetTopics}
            robertson={sheetRwp}
            focus={sheetFocus}
            highlightKey={highlightKey}
            onClose={closeSheet}
            signedIn={Boolean(user)}
            mineNotes={sheetMine}
            mineFocusId={query.note}
            onDictName={(entry, x, y) =>
              setWordPopup({
                kind: 'dict',
                entry,
                word: entry.name,
                verse: sheetVerse ?? 0,
                x,
                y,
              })
            }
          />
        </>
      )}
    </article>
  )
}
