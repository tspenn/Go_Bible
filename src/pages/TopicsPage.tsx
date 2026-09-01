import { useEffect, useMemo, useState } from 'react'
import { Link } from '../App'
import { searchTopics } from '../data/naves'

export function TopicsPage({ search = '' }: { search?: string }) {
  const fromUrl = new URLSearchParams(search).get('q') ?? ''
  const [q, setQ] = useState(fromUrl)
  const results = useMemo(() => searchTopics(q), [q])

  useEffect(() => {
    setQ(fromUrl)
  }, [fromUrl])

  return (
    <article className="page">
      <p className="eyebrow">Nave’s Topical Bible, 1896</p>
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
            {t.summary ? <span>{t.summary}</span> : null}
          </li>
        ))}
      </ul>
    </article>
  )
}
