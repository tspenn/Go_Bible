import { useState } from 'react'
import { Link, navigate } from '../App'
import { TOPICS } from '../data/naves'
import { parseRef } from '../data/kjv'

export function HomePage() {
  const [q, setQ] = useState('')

  function go(e: React.FormEvent) {
    e.preventDefault()
    const ref = parseRef(q)
    if (ref) {
      navigate(`/bible/${ref.bookSlug}/${ref.chapter}/${ref.verse}`)
      return
    }
    navigate(`/topics?q=${encodeURIComponent(q)}`)
  }

  return (
    <article className="page">
      <p className="eyebrow">Companion</p>
      <h1>Look it up. Sit with it.</h1>
      <p className="lead">
        Search a theme the way Nave’s was meant to be used, or open a verse the magazine
        pointed you toward.
      </p>
      <form className="search" onSubmit={go}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Faith, or John 3:16"
          aria-label="Search topics or a verse"
        />
        <button type="submit">Search</button>
      </form>
      <h2>Start here</h2>
      <ul className="topic-list">
        {TOPICS.map((t) => (
          <li key={t.slug}>
            <Link to={`/topics/${t.slug}`}>{t.name}</Link>
            <span>{t.summary}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}
