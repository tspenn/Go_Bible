import { Link } from '../App'
import { LastMark } from '../components/LastMark'
import { CHAPTER_TITLE_SOURCE, chapterTitlesFor } from '../data/chapter-titles'
import { findBook } from '../data/kjv'
import { lastReadLabel, useLastRead } from '../data/last-read'

export function BookPage({ bookSlug }: { bookSlug: string }) {
  const book = findBook(bookSlug)
  const last = useLastRead()
  if (!book) {
    return (
      <article className="page">
        <h1>Book not found</h1>
        <p className="lead">That name is not in this Bible.</p>
        <Link to="/">Home</Link>
      </article>
    )
  }

  const titles = chapterTitlesFor(book.slug)

  return (
    <article className="page">
      <p className="crumb">
        <Link to="/">Home</Link>
      </p>
      <h1>{book.name}</h1>
      <p className="chapter-source">{CHAPTER_TITLE_SOURCE}</p>
      <nav className="chapter-list" aria-label={`${book.name} chapters`}>
        {Array.from({ length: book.chapterCount }, (_, i) => {
          const n = i + 1
          const synopsis = titles[i]
          const isLast = last?.bookSlug === book.slug && last.chapter === n
          return (
            <Link
              key={n}
              to={`/bible/${book.slug}/${n}`}
              className={isLast ? 'has-last' : undefined}
            >
              <span className="chapter-list-head">
                <span className="chapter-list-n">Chapter {n}</span>
                {isLast && last ? <LastMark label={lastReadLabel(last)} /> : null}
              </span>
              {synopsis ? <span className="chapter-list-syn">{synopsis}</span> : null}
            </Link>
          )
        })}
      </nav>
    </article>
  )
}
