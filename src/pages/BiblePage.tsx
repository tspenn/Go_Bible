import { BookPicker } from '../components/BookPicker'

export function BiblePage() {
  return (
    <article className="page">
      <h1>Choose a book</h1>
      <p className="lead">Pick a testament, then a book, then a chapter.</p>
      <BookPicker showStarts />
    </article>
  )
}
