import { useEffect, useRef, useState } from 'react'
import {
  loadGoogleTranslate,
  mountGoogleTranslate,
  OPEN_TRANSLATE,
} from '../lib/googleTranslate'

function TranslateGlobe() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  )
}

export function TranslateControl() {
  const wrap = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    loadGoogleTranslate()
  }, [])

  useEffect(() => {
    if (!open) return
    mountGoogleTranslate()
    const wait = window.setInterval(() => {
      mountGoogleTranslate()
      if (document.querySelector('#google_translate_element .goog-te-combo')) {
        window.clearInterval(wait)
      }
    }, 250)
    const stop = window.setTimeout(() => window.clearInterval(wait), 8000)
    return () => {
      window.clearInterval(wait)
      window.clearTimeout(stop)
    }
  }, [open])

  useEffect(() => {
    function onOpen() {
      window.scrollTo({ top: 0 })
      setOpen(true)
    }
    window.addEventListener(OPEN_TRANSLATE, onOpen)
    return () => window.removeEventListener(OPEN_TRANSLATE, onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    function onDoc(e: Event) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="translate-wrap" ref={wrap}>
      <button
        type="button"
        className="translate-btn"
        aria-expanded={open}
        aria-controls="translate-popover"
        onClick={() => setOpen((v) => !v)}
      >
        <TranslateGlobe />
        Translate
      </button>
      <div className="translate-pop" id="translate-popover" hidden={!open} role="dialog" aria-label="Select language">
        <p className="translate-pop-label">Select Language</p>
        <div id="google_translate_element" />
      </div>
    </div>
  )
}

export function TranslateFooterLink() {
  return (
    <button
      type="button"
      className="translate-foot"
      onClick={() => window.dispatchEvent(new Event(OPEN_TRANSLATE))}
    >
      <TranslateGlobe />
      Translate
    </button>
  )
}
