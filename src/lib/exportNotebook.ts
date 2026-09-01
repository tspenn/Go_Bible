import { bibleBooks, findVerse } from '../data/kjv'
import {
  formatMarkRef,
  penLabel,
  PEN_COLORS,
  type Highlight,
  type MarksState,
  type UserNote,
} from '../data/marks'
import { publicVerseUrl } from '../router'

const BOOK_ORDER = new Map(bibleBooks.map((b, i) => [b.slug, i]))

function byScripture<T extends { bookSlug: string; chapter: number; verse: number }>(a: T, b: T) {
  const ba = BOOK_ORDER.get(a.bookSlug) ?? 999
  const bb = BOOK_ORDER.get(b.bookSlug) ?? 999
  return ba - bb || a.chapter - b.chapter || a.verse - b.verse
}

function verseLine(bookSlug: string, chapter: number, verse: number) {
  return findVerse(bookSlug, chapter, verse)?.text ?? ''
}

export function stamp() {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function fileStamp() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export type LessonNote = UserNote & { ref: string; verseText: string; url: string }
export type LessonHighlight = Highlight & { ref: string; verseText: string; url: string; pen: string }
export type LessonBookmark = {
  id: string
  ref: string
  verseText: string
  url: string
  bookSlug: string
  chapter: number
  verse: number
}

export type LessonExport = {
  notesBySubject: { subject: string; notes: LessonNote[] }[]
  unsortedNotes: LessonNote[]
  highlights: LessonHighlight[]
  bookmarks: LessonBookmark[]
}

export function buildLessonExport(marks: MarksState): LessonExport {
  const toNote = (n: UserNote): LessonNote => ({
    ...n,
    ref: formatMarkRef(n.bookSlug, n.chapter, n.verse),
    verseText: verseLine(n.bookSlug, n.chapter, n.verse),
    url: publicVerseUrl(n.bookSlug, n.chapter, n.verse),
  })
  const subjects = [
    ...new Set(marks.notes.map((n) => n.subject).filter(Boolean) as string[]),
  ].sort((a, b) => a.localeCompare(b))
  return {
    notesBySubject: subjects.map((subject) => ({
      subject,
      notes: marks.notes.filter((n) => n.subject === subject).slice().sort(byScripture).map(toNote),
    })),
    unsortedNotes: marks.notes.filter((n) => !n.subject).slice().sort(byScripture).map(toNote),
    highlights: marks.highlights
      .slice()
      .sort(byScripture)
      .map((h) => ({
        ...h,
        ref: formatMarkRef(h.bookSlug, h.chapter, h.verse),
        verseText: verseLine(h.bookSlug, h.chapter, h.verse),
        url: publicVerseUrl(h.bookSlug, h.chapter, h.verse),
        pen: penLabel(h.color, marks.penNames),
      })),
    bookmarks: marks.bookmarks
      .slice()
      .sort(byScripture)
      .map((b) => ({
        id: b.id,
        bookSlug: b.bookSlug,
        chapter: b.chapter,
        verse: b.verse,
        ref: formatMarkRef(b.bookSlug, b.chapter, b.verse),
        verseText: verseLine(b.bookSlug, b.chapter, b.verse),
        url: publicVerseUrl(b.bookSlug, b.chapter, b.verse),
      })),
  }
}

export function lessonHasContent(lesson: LessonExport) {
  return (
    lesson.notesBySubject.some((g) => g.notes.length > 0) ||
    lesson.unsortedNotes.length > 0 ||
    lesson.highlights.length > 0 ||
    lesson.bookmarks.length > 0
  )
}

function noteBlock(n: LessonNote) {
  const lines = [n.ref]
  if (n.verseText) lines.push(n.verseText)
  if (n.phrase) lines.push(`Marked: “${n.phrase}”`)
  if (n.text) lines.push(`My note: ${n.text}`)
  lines.push(n.url)
  return lines.join('\n')
}

export function lessonToText(lesson: LessonExport) {
  const parts = [`Walking By Faith — Notebook`, `Exported ${stamp()}`, ``]
  if (lesson.notesBySubject.length || lesson.unsortedNotes.length) {
    parts.push('NOTES', '')
    for (const group of lesson.notesBySubject) {
      parts.push(group.subject, '')
      for (const n of group.notes) parts.push(noteBlock(n), '')
    }
    if (lesson.unsortedNotes.length) {
      parts.push('Notes without a subject', '')
      for (const n of lesson.unsortedNotes) parts.push(noteBlock(n), '')
    }
  }
  if (lesson.highlights.length) {
    parts.push('HIGHLIGHTS', '')
    for (const color of PEN_COLORS) {
      const rows = lesson.highlights.filter((h) => h.color === color.id)
      if (!rows.length) continue
      parts.push(rows[0].pen, '')
      for (const h of rows) {
        parts.push(h.ref)
        if (h.verseText) parts.push(h.verseText)
        parts.push(`Highlighted: “${h.phrase}”`)
        parts.push(h.url, '')
      }
    }
  }
  if (lesson.bookmarks.length) {
    parts.push('BOOKMARKS', '')
    for (const b of lesson.bookmarks) {
      parts.push(b.ref)
      if (b.verseText) parts.push(b.verseText)
      parts.push(b.url, '')
    }
  }
  return parts.join('\n').trim() + '\n'
}

export async function downloadLessonText(marks: MarksState) {
  const lesson = buildLessonExport(marks)
  if (!lessonHasContent(lesson)) return false
  const blob = new Blob([lessonToText(lesson)], { type: 'text/plain;charset=utf-8' })
  downloadBlob(blob, `walking-by-faith-notebook-${fileStamp()}.txt`)
  return true
}
