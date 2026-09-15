import { BookPicker } from '../components/BookPicker'
import { ShareArrow, sharePageUrl } from '../components/ShareArrow'
import { TAGLINE } from '../data/starters'

export function HomePage() {
  return (
    <article className="page">
      <div className="page-head">
        <h1>Walking By Faith</h1>
        <ShareArrow
          label="Share this app"
          title="Walking By Faith"
          url={sharePageUrl('/')}
        />
      </div>
      <p className="lead">{TAGLINE}</p>
      <BookPicker />
    </article>
  )
}
