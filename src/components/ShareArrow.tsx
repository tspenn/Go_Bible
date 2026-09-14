import { useState } from 'react'
import { shareQuote } from '../lib/textSelect'

export function sharePageUrl(path: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://go-bible.com'
  return `${origin}${path}`
}

export function ShareArrow({
  title,
  text,
  url,
}: {
  title: string
  text?: string
  url: string
}) {
  const [copied, setCopied] = useState(false)

  async function onShare() {
    const result = await shareQuote({ title, text: text ?? title, url })
    if (result === 'copied') {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    }
  }

  return (
    <button
      type="button"
      className={`share-arrow${copied ? ' copied' : ''}`}
      onClick={() => void onShare()}
      aria-label={copied ? 'Copied link' : 'Share'}
      title={copied ? 'Copied link' : 'Share'}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v11" />
        <path d="M8 7l4-4 4 4" />
        <path d="M6 11v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8" />
      </svg>
    </button>
  )
}
