import { useEffect, useState } from 'react'
import { Link } from '../App'
import {
  booksInTestament,
  findBook,
  testamentOf,
  type Testament,
} from '../data/kjv'

export function BookPicker({
  selectedBook,
  selectedChapter,
  showStarts = false,
}: {
  selectedBook?: string
  selectedChapter?: number
  showStarts?: boolean
}) {
  const [testament, setTestament] = useState<Testament | null>(() =>
    selectedBook ? testamentOf(selectedBook) : null,
  )
  const [bookSlug, setBookSlug] = useState<string | null>(selectedBook ?? null)

  useEffect(() => {
    setTestament(selectedBook ? testamentOf(selectedBook) : null)
    setBookSlug(selectedBook ?? null)
  }, [selectedBook])

  const books = testament ? booksInTestament(testament) : []
  const book = bookSlug ? findBook(bookSlug) : undefined

  function pickTestament(next: Testament) {
    if (testament === next) return
    setTestament(next)
    setBookSlug(null)
  }

  return (
    <div className="book-picker">
      {showStarts && (
        <div className="start-reads">
          <Link className="start-read" to="/bible/john/1">
            Start in John
          </Link>
          <Link className="start-read" to="/bible/psalms/1">
            Start in Psalms
          </Link>
        </div>
      )}

      <p className="picker-step" id="pick-testament">
        1. Choose a testament
      </p>
      <div className="picker-choice" role="group" aria-labelledby="pick-testament">
        <button
          type="button"
          className={testament === 'ot' ? 'on' : undefined}
          aria-pressed={testament === 'ot'}
          onClick={() => pickTestament('ot')}
        >
          Old Testament
        </button>
        <button
          type="button"
          className={testament === 'nt' ? 'on' : undefined}
          aria-pressed={testament === 'nt'}
          onClick={() => pickTestament('nt')}
        >
          New Testament
        </button>
      </div>

      {testament && (
        <>
          <p className="picker-step" id="pick-book">
            2. Choose a book
          </p>
          <div className="picker-choice picker-books" role="group" aria-labelledby="pick-book">
            {books.map((b) => (
              <button
                key={b.slug}
                type="button"
                className={bookSlug === b.slug ? 'on' : undefined}
                aria-pressed={bookSlug === b.slug}
                onClick={() => setBookSlug(b.slug)}
              >
                {b.name}
              </button>
            ))}
          </div>
        </>
      )}

      {book && (
        <>
          <p className="picker-step" id="pick-chapter">
            3. Choose a chapter
          </p>
          <nav className="picker-choice picker-chapters" aria-labelledby="pick-chapter">
            {Array.from({ length: book.chapterCount }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                to={`/bible/${book.slug}/${n}`}
                className={
                  book.slug === selectedBook && n === selectedChapter ? 'on' : undefined
                }
                aria-current={
                  book.slug === selectedBook && n === selectedChapter ? 'page' : undefined
                }
              >
                {book.name} {n}
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  )
}
