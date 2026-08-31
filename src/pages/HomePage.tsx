import { Link } from '../App'
import { TOPICS } from '../data/naves'

export function HomePage() {
  return (
    <article className="page">
      <p className="eyebrow">Companion</p>
      <h1>Look it up. Sit with it.</h1>
      <p className="lead">
        Open a chapter and read. Search the header for a topic, or a verse like John 3:16.
      </p>
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
