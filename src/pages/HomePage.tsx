import { Link } from '../App'
import { BookPicker } from '../components/BookPicker'

export function HomePage() {
  return (
    <article className="page">
      <h1>Go-Bible</h1>
      <p className="lead">A Bible you can read. Tap a word or verse number for notes.</p>
      <p className="themes-link">
        <Link to="/topics">Themes</Link>
      </p>
      <BookPicker showStarts />
    </article>
  )
}
