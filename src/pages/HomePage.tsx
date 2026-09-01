import { BookPicker } from '../components/BookPicker'
import { TAGLINE } from '../data/starters'

export function HomePage() {
  return (
    <article className="page">
      <h1>Walking By Faith</h1>
      <p className="lead">{TAGLINE}</p>
      <BookPicker />
    </article>
  )
}
