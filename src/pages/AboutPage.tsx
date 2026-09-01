import { Link } from '../App'
import { HENRY_SOURCE } from '../data/henry'
import { SOURCE_LINE } from '../data/kjv'
import { ROBERTSON_SOURCE } from '../data/robertson'
import { SCOFIELD_SOURCE } from '../data/scofield'
import { MAGAZINE_BLURB, MAGAZINE_LABEL, MAGAZINE_URL, TAGLINE } from '../data/starters'
import { TSK_SOURCE } from '../data/tsk'

export function AboutPage() {
  return (
    <article className="page">
      <h1>About</h1>
      <p className="lead">{TAGLINE}</p>

      <h2>The reading text</h2>
      <p>{SOURCE_LINE}</p>
      <p>
        This is a tool for reading Scripture, not a stand-in for the Bible you already trust. Newer
        English Bibles such as the NIV, ESV, NASB, and NLT are under copyright. Those laws limit what
        a free app may give you in full. We are not free to ship those translations, so the words on
        the page are a public-domain English text, with the divine name shown as LORD, set in
        paragraphs the way the source text groups them.
      </p>

      <h2>Marks in the text</h2>
      <ul className="how-to">
        <li>Gold italic letters are 1917 Scofield notes. Tap the letter or the marked phrase.</li>
        <li>Slate-blue words in Matthew, Mark, Luke, and Acts are A. T. Robertson Word Pictures (1930).</li>
        <li>Green “See also” links are the original Treasury of Scripture Knowledge (about 1880).</li>
        <li>Dotted names are Easton (1897) or Smith, public domain.</li>
        <li>Select two or more words, then right-click (on a phone, press the selection) for Highlight, Share, Note, See Commentary, or Copy. See Commentary opens Matthew Henry from those words.</li>
      </ul>

      <h2>Sources</h2>
      <ul className="how-to">
        <li>{SCOFIELD_SOURCE}</li>
        <li>{HENRY_SOURCE}</li>
        <li>{TSK_SOURCE}</li>
        <li>{ROBERTSON_SOURCE} Complete Matthew, Mark, Luke, and Acts. John through Revelation wait until those volumes are public domain.</li>
        <li>Nave’s Topical Bible, Orville J. Nave, 1896 (public domain). Verses are printed under each heading from the Go-Bible reading text.</li>
      </ul>

      <p>
        <Link to="/settings">How to use the Bible</Link>
        {' · '}
        <Link to="/bible">Open the Bible</Link>
      </p>
      <p>
        <a href={MAGAZINE_URL} target="_blank" rel="noopener noreferrer">
          {MAGAZINE_LABEL}
        </a>
        {' — '}
        {MAGAZINE_BLURB}
      </p>
    </article>
  )
}
