import { Link } from '../App'
import { PEN_COLORS, penLabel, setPenName, useMarks } from '../data/marks'
import { useAuth } from '../lib/auth'

export function SettingsPage() {
  const { user } = useAuth()
  const marks = useMarks()

  return (
    <article className="page">
      <h1>How to use Go-Bible</h1>
      <p className="lead">
        A Bible you can read. Reference notes are public. Your highlights, bookmarks, and notes stay
        with your account on this device until you sign out.
      </p>

      <h2>Find a chapter</h2>
      <ol className="how-to">
        <li>On the home page, tap Old Testament or New Testament.</li>
        <li>Tap a book by name.</li>
        <li>Tap a chapter labeled with the book name, like John 3.</li>
      </ol>
      <p>
        <Link to="/bible/john/1">Start in John</Link>
        {' · '}
        <Link to="/bible/psalms/1">Start in Psalms</Link>
      </p>

      <h2>Notes in the text</h2>
      <ul className="how-to">
        <li>Tap a verse number to open Scofield, Henry, dictionary, topics, and (in Matthew–Acts) Robertson.</li>
        <li>Gold italic letters a, b, c are 1917 Scofield notes. Tap the letter or the marked phrase.</li>
        <li>Blue dotted names are Easton or Smith dictionary entries.</li>
        <li>Header search finds a topic or a verse such as John 3:16.</li>
      </ul>

      <h2>Your marks</h2>
      <ul className="how-to">
        <li>Sign in to create or see personal marks. Signed out, the Bible and reference panel still work.</li>
        <li>Press and hold a word or phrase, then choose Highlight, Bookmark, or Add my note.</li>
        <li>A highlight is a wash behind those words. You may name pens below. Colors have no set meaning.</li>
        <li>A bookmark is a ribbon on the verse, not a color. You can also bookmark from the notes panel.</li>
        <li>Your notes show a ★ (or 1, 2, 3 if you have more than one on that verse). They are not Scofield letters.</li>
        <li>Tap ★ to open My note in the panel.</li>
        <li>You stay signed in across tab close, browser close, and iPad sleep. Sign out only if you tap Sign out.</li>
      </ul>
      <p>
        {user ? (
          <Link to="/notebook">Open your notebook</Link>
        ) : (
          <Link to="/login?next=/notebook">Sign in to open your notebook</Link>
        )}
      </p>

      <h2>Pens</h2>
      {user ? (
        <>
          <p>Names are optional. If you leave a name blank, the color name is used.</p>
          <ul className="pen-settings">
            {PEN_COLORS.map((p) => (
              <li key={p.id}>
                <span className="pen-swatch" style={{ background: p.wash }} aria-hidden="true" />
                <label>
                  {p.label}
                  <input
                    value={marks.penNames[p.id] ?? ''}
                    onChange={(e) => void setPenName(p.id, e.target.value)}
                    placeholder="Optional name"
                    aria-label={`Name for ${p.label} pen`}
                  />
                </label>
                <span className="fine">{penLabel(p.id, marks.penNames)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>
          <Link to="/login?next=/settings">Sign in</Link> to name pens. Colors have no set meaning.
        </p>
      )}
    </article>
  )
}
