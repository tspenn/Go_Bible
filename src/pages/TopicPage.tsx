import { useEffect } from 'react'
import { Link } from '../App'
import { parseRef, type Verse } from '../data/kjv'
import {
  ensureNavesTopic,
  findTopic,
  formatNaveRef,
  NAVES_SOURCE,
  naveRefHref,
  naveTopicName,
  navesTopicReady,
  useNaves,
  versesForNaveRef,
  type NaveRef,
} from '../data/naves'

function seedRefs(refs: string[]): NaveRef[] {
  const out: NaveRef[] = []
  for (const raw of refs) {
    const p = parseRef(raw)
    if (p) out.push(p)
  }
  return out
}

function NaveScripture({ refs }: { refs: NaveRef[] }) {
  return (
    <ol className="nave-verses">
      {refs.map((ref) => {
        const verses = versesForNaveRef(ref)
        return (
          <li key={`${ref.bookSlug}-${ref.chapter}-${ref.verse}-${ref.verseEnd ?? ''}`}>
            <Link className="nave-cite" to={naveRefHref(ref)}>
              {formatNaveRef(ref)}
            </Link>
            {verses.map((v: Verse) => (
              <p key={v.verse} className="nave-text">
                {verses.length > 1 ? (
                  <Link className="nave-vn" to={naveRefHref({ ...ref, verse: v.verse, verseEnd: undefined })}>
                    {v.verse}
                  </Link>
                ) : null}
                {v.text}
              </p>
            ))}
          </li>
        )
      })}
    </ol>
  )
}

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

  const dump = topic.dump
  const seedOnly = !dump && topic.seed && topic.seed.refs.length > 0

  return (
    <article className="page">
      <p className="eyebrow">Nave’s</p>
      <h1>{topic.name}</h1>
      {topic.seed ? <p className="lead">{topic.seed.summary}</p> : null}
      {dump ? <p className="source-line">{NAVES_SOURCE}</p> : null}
      {seedOnly ? <NaveScripture refs={seedRefs(topic.seed!.refs)} /> : null}
      {dump
        ? dump.subtopics.map((sub, i) => (
            <section key={`${sub.label}-${i}`}>
              {sub.label ? <h2>{sub.label}</h2> : null}
              {sub.refs.length > 0 ? <NaveScripture refs={sub.refs} /> : null}
            </section>
          ))
        : null}
      {dump && dump.related.length > 0 ? (
        <>
          <h2>See also</h2>
          <ul className="refs">
            {dump.related.map((rel) => (
              <li key={rel}>
                <Link to={`/topics/${rel}`}>{naveTopicName(rel)}</Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <p>
        <Link to="/topics">All topics</Link>
      </p>
    </article>
  )
}
