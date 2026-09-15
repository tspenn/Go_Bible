import { BookPicker } from '../components/BookPicker'
import { ShareArrow, sharePageUrl } from '../components/ShareArrow'
import { TAGLINE } from '../data/starters'

export function HomePage() {
  return (
    <article className="page">
      <h1>Walking By Faith</h1>
      <p className="lead">{TAGLINE}</p>
      <ShareArrow
        label="Share this app"
        title="Walking By Faith"
        text={TAGLINE}
        url={sharePageUrl('/')}
      />
      <BookPicker />
    </article>
  )
}
