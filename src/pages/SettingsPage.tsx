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
      <p>
        <Link to="/about">About the text, copyright, and sources</Link>
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
        <li>Tap a verse number to open Scofield, Henry, See also (Treasury of Scripture Knowledge), dictionary, topics, and (in Matthew–Acts) Robertson.</li>
        <li>Topics open Nave’s with the Bible verses written out under each heading, so you can read them in one place.</li>
        <li>Select two or more words in the chapter, then right-click (on a phone, press the selection). Choose Highlight, Share, Note, See Commentary, or Copy. The words stay marked while the menu is open. Share uses your device share sheet. Highlight opens the pen colors. See Commentary opens Matthew Henry from those words, not a download panel.</li>
        <li>Gold italic letters a, b, c are 1917 Scofield notes. Tap the letter or the marked phrase.</li>
        <li>In Matthew, Mark, Luke, and Acts, a slate-blue word has an A. T. Robertson Word Picture (1930). Tap the word or its letter.</li>
        <li>See also lists original TSK cross-references in green. Hover or press a link for “Go to …” then tap to open that verse. The first six links show; tap More references for the rest.</li>
        <li>Blue dotted names are Easton or Smith dictionary entries.</li>
        <li>Listen to this chapter reads the Go-Bible text aloud. It uses a United States English voice, not a British one. Pause, Resume, and Stop sit beside the chapter title. The verse being read is washed in light blue.</li>
      </ul>

      <h2>Your marks</h2>
      <ul className="how-to">
        <li>Sign in to create or see personal marks. Signed out, the Bible still reads, and you can still Copy, Share, and See Commentary from a selection.</li>
        <li>Select two or more words, then choose Highlight or Note. Bookmark stays on the verse number notes if you want a ribbon.</li>
        <li>A highlight is a wash behind those words. You may name pens below. Colors have no set meaning.</li>
        <li>A bookmark is a ribbon on the verse, not a color. You can also bookmark from the notes panel.</li>
        <li>Your notes show a ★ (or 1, 2, 3 if you have more than one on that verse). They are not Scofield letters.</li>
        <li>Tap ★ to open My note in the panel.</li>
        <li>You stay signed in across tab close, browser close, and iPad sleep. Sign out only if you tap Sign out.</li>
        <li>In Notebook, choose Download text or Download Word for a Sunday School file of your verses, marks, and notes.</li>
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
