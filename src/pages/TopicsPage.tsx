import { useMemo, useState } from 'react'
import { Link } from '../App'
import { searchTopics } from '../data/naves'

export function TopicsPage() {
  const initial = new URLSearchParams(window.location.search).get('q') ?? ''
  const [q, setQ] = useState(initial)
  const results = useMemo(() => searchTopics(q), [q])

  return (
    <article className="page">
      <p className="eyebrow">Nave’s Topical Bible</p>
      <h1>Topics</h1>
      <input
        className="search-input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search topics"
        aria-label="Search topics"
      />
      <ul className="topic-list">
        {results.map((t) => (
          <li key={t.slug}>
            <Link to={`/topics/${t.slug}`}>{t.name}</Link>
            <span>{t.summary}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}
