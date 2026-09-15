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
  label,
  onStart,
  sessionKey,
}: {
  label: string
  onStart: () => void | Promise<void>
  sessionKey: string
}) {
  const speak = useSpeak()

  useEffect(() => {
    return () => stopSpeak()
  }, [sessionKey])

  if (!speak.supported) return null

  const listening = speak.status !== 'idle'

  return (
    <>
      {listening ? <div className="listen-row-slot" aria-hidden="true" /> : null}
      <div className={`listen-row${listening ? ' listening' : ''}`}>
        {speak.status === 'idle' && (
          <button type="button" className="listen-btn" onClick={() => void onStart()}>
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
        {listening && (
          <button type="button" className="listen-btn quiet" onClick={stopSpeak}>
            Stop
          </button>
        )}
        {speak.voiceName && listening && (
          <span className="listen-voice">{speak.voiceName}</span>
        )}
      </div>
    </>
  )
}

export function ChapterListen({
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
  const label = fromVerse && fromVerse > 1 ? `Listen from verse ${fromVerse}` : 'Listen to this chapter'
  return (
    <ListenControl
      sessionKey={`${bookName}-${chapter}`}
      label={label}
      onStart={() => startChapterSpeak({ bookName, chapter, verses, fromVerse })}
    />
  )
}
