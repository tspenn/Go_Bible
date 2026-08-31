import { Link } from '../App'
import { findTopic } from '../data/naves'
import { verseHref } from '../router'

export function TopicPage({ slug }: { slug: string }) {
  const topic = findTopic(slug)
  if (!topic) {
    return (
      <article className="page">
        <h1>Topic not found</h1>
        <Link to="/topics">Back to topics</Link>
      </article>
    )
  }

  return (
    <article className="page">
      <p className="eyebrow">Nave’s</p>
      <h1>{topic.name}</h1>
      <p className="lead">{topic.summary}</p>
      <h2>Scripture</h2>
      <ul className="refs">
        {topic.refs.map((ref) => {
          const to = verseHref(ref)
          return (
            <li key={ref}>
              {to ? <Link to={to}>{ref}</Link> : ref}
            </li>
          )
        })}
      </ul>
      <p>
        <Link to="/topics">All topics</Link>
      </p>
    </article>
  )
}
