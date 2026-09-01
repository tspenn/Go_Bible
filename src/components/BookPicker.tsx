import { useState } from 'react'
import { Link } from '../App'
import { LastMark } from './LastMark'
import { booksInTestament, type Testament } from '../data/kjv'
import {
  lastReadHref,
  lastReadLabel,
  lastReadTestament,
  useLastRead,
} from '../data/last-read'

function TestamentDrop({
  label,
  testament,
  open,
  onToggle,
  selectedBook,
}: {
  label: string
  testament: Testament
  open: boolean
  onToggle: () => void
  selectedBook?: string
}) {
  const books = booksInTestament(testament)
  const last = useLastRead()
  const flagged = lastReadTestament(last) === testament
  const id = `testament-${testament}`

  return (
    <div className="testament-drop">
      <div className={`testament-row${open ? ' open' : ''}`}>
        <button type="button" aria-expanded={open} aria-controls={id} onClick={onToggle}>
          {label}
        </button>
        {flagged && last ? <LastMark to={lastReadHref(last)} label={lastReadLabel(last)} /> : null}
      </div>
      {open ? (
        <ul id={id} className="testament-books">
          {books.map((b) => {
            const isLastBook = last?.bookSlug === b.slug
            return (
              <li key={b.slug} className={isLastBook ? 'has-last' : undefined}>
                <Link
                  to={`/bible/${b.slug}`}
                  aria-current={b.slug === selectedBook ? 'page' : undefined}
                >
                  {b.name}
                </Link>
                {isLastBook && last ? (
                  <LastMark to={lastReadHref(last)} label={lastReadLabel(last)} />
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

export function BookPicker({ selectedBook }: { selectedBook?: string }) {
  const [open, setOpen] = useState<Testament | null>(null)

  function toggle(next: Testament) {
    setOpen((cur) => (cur === next ? null : next))
  }

  return (
    <div className="book-picker">
      <TestamentDrop
        label="Old Testament"
        testament="ot"
        open={open === 'ot'}
        onToggle={() => toggle('ot')}
        selectedBook={selectedBook}
      />
      <TestamentDrop
        label="New Testament"
        testament="nt"
        open={open === 'nt'}
        onToggle={() => toggle('nt')}
        selectedBook={selectedBook}
      />
    </div>
  )
}
