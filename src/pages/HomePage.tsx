import { BookPicker } from '../components/BookPicker'

export function HomePage() {
  return (
    <article className="page">
      <h1>Walking By Faith</h1>
      <p className="lead">Bible and Bible Study Tools</p>
      <BookPicker />
    </article>
  )
}
