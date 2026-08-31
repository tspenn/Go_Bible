import { Link } from '../App'
import { bibleBooks } from '../data/kjv'

export function BiblePage() {
  return (
    <article className="page">
      <p className="eyebrow">Go-Bible</p>
      <h1>Bible</h1>
      <p className="lead">Open a chapter. Magazine verse links land here.</p>
      <ul className="topic-list book-index">
        {bibleBooks.map((b) => (
          <li key={b.slug}>
            <Link to={`/bible/${b.slug}/1`}>{b.name}</Link>
            <span className="chapter-index">
              {Array.from({ length: b.chapterCount }, (_, i) => i + 1).map((n) => (
                <Link key={n} to={`/bible/${b.slug}/${n}`}>
                  {n}
                </Link>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </article>
  )
}
