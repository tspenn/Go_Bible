import { useEffect, useState } from 'react'
import { Link } from '../App'
import { bookName } from '../data/kjv'
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

  const searching = q.trim().length >= 2
  const total = results ? STUDY_ORDER.reduce((n, src) => n + results[src].length, 0) : 0

  return (
    <article className="page">
      <h1>Topics</h1>
      <input
        className="search-input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search topics"
        aria-label="Search topics"
      />
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
