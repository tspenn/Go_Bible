import { useEffect } from 'react'
import { Link } from '../App'
import {
  ensureNavesTopic,
  findTopic,
  formatNaveRef,
  NAVES_SOURCE,
  naveRefHref,
  naveTopicName,
  navesTopicReady,
  useNaves,
} from '../data/naves'
import { verseHref } from '../router'

export function TopicPage({ slug }: { slug: string }) {
  useNaves()
  useEffect(() => {
    void ensureNavesTopic(slug)
  }, [slug])
  const topic = findTopic(slug)
  if (!topic) {
    if (!navesTopicReady(slug)) {
      return (
        <article className="page">
          <p className="eyebrow">Nave’s</p>
          <h1>Loading…</h1>
        </article>
      )
    }
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
      {topic.seed ? <p className="lead">{topic.seed.summary}</p> : null}
      {topic.seed && topic.seed.refs.length > 0 ? (
        <>
          <h2>Scripture</h2>
          <ul className="refs">
            {topic.seed.refs.map((ref) => {
              const to = verseHref(ref)
              return <li key={ref}>{to ? <Link to={to}>{ref}</Link> : ref}</li>
            })}
          </ul>
        </>
      ) : null}
      {topic.dump ? (
        <>
          <p className="source-line">{NAVES_SOURCE}</p>
          {topic.dump.subtopics.map((sub, i) => (
            <section key={`${sub.label}-${i}`}>
              {sub.label ? <h2>{sub.label}</h2> : null}
              {sub.refs.length > 0 ? (
                <ul className="refs">
                  {sub.refs.map((ref) => (
                    <li key={`${ref.bookSlug}-${ref.chapter}-${ref.verse}-${ref.verseEnd ?? ''}`}>
                      <Link to={naveRefHref(ref)}>{formatNaveRef(ref)}</Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
          {topic.dump.related.length > 0 ? (
            <>
              <h2>See also</h2>
              <ul className="refs">
                {topic.dump.related.map((rel) => (
                  <li key={rel}>
                    <Link to={`/topics/${rel}`}>{naveTopicName(rel)}</Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      ) : null}
      <p>
        <Link to="/topics">All topics</Link>
      </p>
    </article>
  )
}
