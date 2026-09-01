import { useEffect } from 'react'
import type { Verse } from '../data/kjv'
import {
  pauseSpeak,
  resumeSpeak,
  startChapterSpeak,
  stopSpeak,
  useSpeak,
} from '../lib/speak'

export function ListenControl({
  bookName,
  chapter,
  verses,
  fromVerse,
}: {
  bookName: string
  chapter: number
  verses: Pick<Verse, 'verse' | 'text'>[]
  fromVerse?: number
}) {
  const speak = useSpeak()

  useEffect(() => {
    return () => stopSpeak()
  }, [bookName, chapter])

  if (!speak.supported) return null

  const label = fromVerse && fromVerse > 1 ? `Listen from verse ${fromVerse}` : 'Listen to this chapter'

  return (
    <div className="listen-row">
      {speak.status === 'idle' && (
        <button
          type="button"
          className="listen-btn"
          onClick={() => void startChapterSpeak({ bookName, chapter, verses, fromVerse })}
        >
          {label}
        </button>
      )}
      {speak.status === 'playing' && (
        <button type="button" className="listen-btn" onClick={pauseSpeak}>
          Pause
        </button>
      )}
      {speak.status === 'paused' && (
        <button type="button" className="listen-btn" onClick={resumeSpeak}>
          Resume
        </button>
      )}
      {speak.status !== 'idle' && (
        <button type="button" className="listen-btn quiet" onClick={stopSpeak}>
          Stop
        </button>
      )}
      {speak.voiceName && speak.status !== 'idle' && (
        <span className="listen-voice">{speak.voiceName}</span>
      )}
    </div>
  )
}
