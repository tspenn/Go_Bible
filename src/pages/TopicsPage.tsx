import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '../App'
import { bookName } from '../data/kjv'
import { featuredOneWords, oneWordSuggestions } from '../data/naves'
import { MORE_NAVE_STARTERS, MORE_STARTERS, STARTER_TOPICS, type StarterTopic } from '../data/starters'
import {
  searchStudy,
  STUDY_LABELS,
  STUDY_ORDER,
  type StudyHit,
  type StudyResults,
} from '../data/study-search'

function scofieldLabel(t: StarterTopic) {
  return `${bookName(t.scofield.bookSlug)} ${t.scofield.chapter}:${t.scofield.verse}`
}

function StarterList({ items }: { items: StarterTopic[] }) {
  return (
    <ul className="starter-list">
      {items.map((t) => (
        <li key={t.id}>
          <Link className="starter-title" to={`/topics/${t.naveSlug}`}>
            {t.title}
          </Link>
          <p className="starter-links">
            <Link to={`/topics/${t.naveSlug}`}>{t.naveName}</Link>
            <span aria-hidden="true"> · </span>
            <Link
              to={`/bible/${t.scofield.bookSlug}/${t.scofield.chapter}/${t.scofield.verse}?tab=scofield`}
            >
              {scofieldLabel(t)}, {t.scofield.label}
            </Link>
          </p>
        </li>
      ))}
    </ul>
  )
}

function HitList({ hits }: { hits: StudyHit[] }) {
  if (hits.length === 0) return null
  return (
    <ul className="topic-list">
      {hits.map((h, i) => (
        <li key={`${h.source}-${h.href}-${h.title}-${i}`}>
          {h.href ? <Link to={h.href}>{h.title}</Link> : <span className="hit-title">{h.title}</span>}
          {h.detail ? <span>{h.detail}</span> : null}
        </li>
      ))}
    </ul>
  )
}

export function TopicsPage({ search = '' }: { search?: string }) {
  const fromUrl = new URLSearchParams(search).get('q') ?? ''
  const [q, setQ] = useState(fromUrl)
  const [results, setResults] = useState<StudyResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [active, setActive] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(() => (q.trim() ? oneWordSuggestions(q, 8) : []), [q])
  const chips = featuredOneWords()

  useEffect(() => {
    setQ(fromUrl)
  }, [fromUrl])

  useEffect(() => {
    const n = q.trim()
    if (n.length < 2) {
      setResults(null)
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    const t = window.setTimeout(() => {
      void searchStudy(n).then((r) => {
        if (!alive) return
        setResults(r)
        setLoading(false)
      })
    }, 120)
    return () => {
      alive = false
      window.clearTimeout(t)
    }
  }, [q])

  useEffect(() => {
    setActive(0)
  }, [suggestions])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setSuggestOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function pick(word: string) {
    setQ(word)
    setSuggestOpen(false)
  }

  const searching = q.trim().length >= 2
  const total = results ? STUDY_ORDER.reduce((n, src) => n + results[src].length, 0) : 0
  const showList = suggestOpen && suggestions.length > 0

  return (
    <article className="page">
      <h1>Topics</h1>
      <div className="topic-search" ref={boxRef}>
        <input
          className="search-input"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setSuggestOpen(true)
          }}
          onFocus={() => setSuggestOpen(true)}
          onKeyDown={(e) => {
            if (!showList) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((i) => (i + 1) % suggestions.length)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((i) => (i - 1 + suggestions.length) % suggestions.length)
            } else if (e.key === 'Enter' && suggestions[active]) {
              e.preventDefault()
              pick(suggestions[active])
            } else if (e.key === 'Escape') {
              setSuggestOpen(false)
            }
          }}
          placeholder="Search topics"
          aria-label="Search topics"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls="topic-suggest"
          autoComplete="off"
          role="combobox"
        />
        {showList ? (
          <ul id="topic-suggest" className="topic-suggest" role="listbox">
            {suggestions.map((word, i) => (
              <li key={word} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  className={i === active ? 'on' : undefined}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(word)}
                >
                  {word}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {!searching ? (
        <div className="topic-chips" aria-label="Suggested topics">
          {chips.map((word) => (
            <button type="button" key={word} onClick={() => pick(word)}>
              {word}
            </button>
          ))}
        </div>
      ) : null}
      {searching ? (
        <>
          {loading && !results ? <p className="lead">Searching…</p> : null}
          {results && total === 0 ? <p>No matching topics.</p> : null}
          {results
            ? STUDY_ORDER.map((src) =>
                results[src].length > 0 ? (
                  <section key={src}>
                    <h2>{STUDY_LABELS[src]}</h2>
                    <HitList hits={results[src]} />
                  </section>
                ) : null,
              )
            : null}
        </>
      ) : (
        <>
          <h2>For starters</h2>
          <StarterList items={STARTER_TOPICS} />
          <h2>Also worth opening</h2>
          <StarterList items={MORE_STARTERS} />
          <h2>More topics</h2>
          <StarterList items={MORE_NAVE_STARTERS} />
        </>
      )}
    </article>
  )
}
