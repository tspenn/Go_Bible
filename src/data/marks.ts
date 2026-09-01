import { useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabase'
import { bookName } from './kjv'

export const PEN_COLORS = [
  { id: 'yellow', label: 'Yellow', wash: '#f5e6a3' },
  { id: 'gold', label: 'Gold', wash: '#ead4a0' },
  { id: 'orange', label: 'Orange', wash: '#f0c9a8' },
  { id: 'pink', label: 'Pink', wash: '#f3c5d4' },
  { id: 'rose', label: 'Rose', wash: '#e8b8b8' },
  { id: 'sage', label: 'Sage', wash: '#c9d4c0' },
  { id: 'teal', label: 'Teal', wash: '#b8d4d0' },
  { id: 'dusty-blue', label: 'Dusty blue', wash: '#c5d0db' },
  { id: 'lavender', label: 'Lavender', wash: '#d4cce0' },
  { id: 'gray', label: 'Gray', wash: '#d5d2cc' },
] as const

export type PenId = (typeof PEN_COLORS)[number]['id']

export type Bookmark = {
  id: string
  bookSlug: string
  chapter: number
  verse: number
  createdAt: number
}

export type Highlight = {
  id: string
  bookSlug: string
  chapter: number
  verse: number
  phrase: string
  color: PenId
  createdAt: number
}

export type UserNote = {
  id: string
  bookSlug: string
  chapter: number
  verse: number
  phrase: string
  color?: PenId
  markLabel: string
  text: string
  subject?: string
  createdAt: number
}

export type MarksState = {
  penNames: Partial<Record<PenId, string>>
  bookmarks: Bookmark[]
  highlights: Highlight[]
  notes: UserNote[]
}

const EMPTY: MarksState = {
  penNames: {},
  bookmarks: [],
  highlights: [],
  notes: [],
}

const USER_MARKS = new Set(['★', '1', '2', '3'])

let state: MarksState = EMPTY
let activeUserId: string | null = null
let loadGen = 0
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((fn) => fn())
}

function setState(next: MarksState) {
  state = next
  emit()
}

function isPenId(value: string | null | undefined): value is PenId {
  return PEN_COLORS.some((p) => p.id === value)
}

function stamp(iso: string | null | undefined) {
  if (!iso) return Date.now()
  const n = Date.parse(iso)
  return Number.isNaN(n) ? Date.now() : n
}

function userMarkLabel(label: string | null | undefined) {
  const trimmed = label?.trim() ?? ''
  if (USER_MARKS.has(trimmed)) return trimmed
  return '★'
}

async function currentUserId() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id ?? null
}

async function relabelVerseNotes(
  userId: string,
  bookSlug: string,
  chapter: number,
  verse: number,
) {
  if (!supabase) return
  const client = supabase
  const notes = state.notes
    .filter((n) => n.bookSlug === bookSlug && n.chapter === chapter && n.verse === verse)
    .sort((a, b) => a.createdAt - b.createdAt)
  const updates = notes.map((n, i) => {
    const markLabel = mineGlyph(i, notes.length)
    return n.markLabel === markLabel ? null : { id: n.id, markLabel }
  })
  const pending = updates.filter((u): u is { id: string; markLabel: string } => u != null)
  if (pending.length === 0) return
  await Promise.all(
    pending.map((u) =>
      client.from('user_notes').update({ mark_label: u.markLabel }).eq('id', u.id).eq('user_id', userId),
    ),
  )
  setState({
    ...state,
    notes: state.notes.map((n) => {
      const hit = pending.find((u) => u.id === n.id)
      return hit ? { ...n, markLabel: hit.markLabel } : n
    }),
  })
}

async function loadFromCloud(userId: string) {
  if (!supabase) {
    setState(EMPTY)
    return
  }
  const gen = ++loadGen
  const [highlightsRes, bookmarksRes, notesRes, pensRes] = await Promise.all([
    supabase.from('highlights').select('id, book, chapter, verse, phrase, color, created_at').eq('user_id', userId),
    supabase.from('bookmarks').select('id, book, chapter, verse, created_at').eq('user_id', userId),
    supabase
      .from('user_notes')
      .select('id, book, chapter, verse, phrase, color, mark_label, body, subject, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
    supabase.from('pens').select('color_id, name').eq('user_id', userId),
  ])
  if (gen !== loadGen || activeUserId !== userId) return

  const highlights: Highlight[] = []
  for (const row of highlightsRes.data ?? []) {
    if (!isPenId(row.color)) continue
    highlights.push({
      id: row.id,
      bookSlug: row.book,
      chapter: row.chapter,
      verse: row.verse,
      phrase: row.phrase,
      color: row.color,
      createdAt: stamp(row.created_at),
    })
  }

  const bookmarks: Bookmark[] = (bookmarksRes.data ?? []).map((row) => ({
    id: row.id,
    bookSlug: row.book,
    chapter: row.chapter,
    verse: row.verse,
    createdAt: stamp(row.created_at),
  }))

  const notes: UserNote[] = (notesRes.data ?? []).map((row) => ({
    id: row.id,
    bookSlug: row.book,
    chapter: row.chapter,
    verse: row.verse,
    phrase: row.phrase,
    color: isPenId(row.color) ? row.color : undefined,
    markLabel: userMarkLabel(row.mark_label),
    text: row.body,
    subject: row.subject?.trim() || undefined,
    createdAt: stamp(row.created_at),
  }))

  const penNames: Partial<Record<PenId, string>> = {}
  for (const row of pensRes.data ?? []) {
    if (!isPenId(row.color_id)) continue
    const name = row.name?.trim()
    if (name) penNames[row.color_id] = name
  }

  setState({ penNames, bookmarks, highlights, notes })
}

export function syncMarksSession(userId: string | null) {
  activeUserId = userId
  if (!userId) {
    loadGen += 1
    setState(EMPTY)
    return
  }
  void loadFromCloud(userId)
}

export function getMarks() {
  return state
}

export function subscribeMarks(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function penMeta(id: PenId) {
  return PEN_COLORS.find((p) => p.id === id) ?? PEN_COLORS[0]
}

export function penLabel(id: PenId, names: Partial<Record<PenId, string>> = state.penNames) {
  const custom = names[id]?.trim()
  return custom || penMeta(id).label
}

const penSaveTimers = new Map<PenId, ReturnType<typeof setTimeout>>()

export async function setPenName(id: PenId, name: string) {
  const userId = await currentUserId()
  if (!userId || !supabase) return
  const trimmed = name.trim()
  const penNames = { ...state.penNames }
  if (trimmed) penNames[id] = trimmed
  else delete penNames[id]
  setState({ ...state, penNames })
  const client = supabase
  const prior = penSaveTimers.get(id)
  if (prior) clearTimeout(prior)
  penSaveTimers.set(
    id,
    setTimeout(() => {
      void client.from('pens').upsert({
        user_id: userId,
        color_id: id,
        name: trimmed,
      })
    }, 400),
  )
}

export function isBookmarked(bookSlug: string, chapter: number, verse: number) {
  return state.bookmarks.some(
    (b) => b.bookSlug === bookSlug && b.chapter === chapter && b.verse === verse,
  )
}

export async function toggleBookmark(bookSlug: string, chapter: number, verse: number) {
  const userId = await currentUserId()
  if (!userId || !supabase) return false
  const existing = state.bookmarks.find(
    (b) => b.bookSlug === bookSlug && b.chapter === chapter && b.verse === verse,
  )
  if (existing) {
    setState({ ...state, bookmarks: state.bookmarks.filter((b) => b.id !== existing.id) })
    await supabase.from('bookmarks').delete().eq('id', existing.id).eq('user_id', userId)
    return false
  }
  const { data, error } = await supabase
    .from('bookmarks')
    .insert({ user_id: userId, book: bookSlug, chapter, verse })
    .select('id, created_at')
    .single()
  if (error || !data) {
    void loadFromCloud(userId)
    return false
  }
  setState({
    ...state,
    bookmarks: [
      ...state.bookmarks,
      { id: data.id, bookSlug, chapter, verse, createdAt: stamp(data.created_at) },
    ],
  })
  return true
}

export async function addHighlight(
  bookSlug: string,
  chapter: number,
  verse: number,
  phrase: string,
  color: PenId,
) {
  const userId = await currentUserId()
  if (!userId || !supabase) return
  const trimmed = phrase.trim()
  if (!trimmed) return
  const same = state.highlights.find(
    (h) =>
      h.bookSlug === bookSlug &&
      h.chapter === chapter &&
      h.verse === verse &&
      h.phrase.toLowerCase() === trimmed.toLowerCase(),
  )
  if (same) {
    setState({
      ...state,
      highlights: state.highlights.map((h) => (h.id === same.id ? { ...h, color } : h)),
    })
    await supabase.from('highlights').update({ color }).eq('id', same.id).eq('user_id', userId)
    return
  }
  const { data, error } = await supabase
    .from('highlights')
    .insert({
      user_id: userId,
      book: bookSlug,
      chapter,
      verse,
      phrase: trimmed,
      color,
    })
    .select('id, created_at')
    .single()
  if (error || !data) {
    void loadFromCloud(userId)
    return
  }
  setState({
    ...state,
    highlights: [
      ...state.highlights,
      {
        id: data.id,
        bookSlug,
        chapter,
        verse,
        phrase: trimmed,
        color,
        createdAt: stamp(data.created_at),
      },
    ],
  })
}

export async function removeHighlight(id: string) {
  const userId = await currentUserId()
  if (!userId || !supabase) return
  setState({ ...state, highlights: state.highlights.filter((h) => h.id !== id) })
  await supabase.from('highlights').delete().eq('id', id).eq('user_id', userId)
}

export async function addNote(note: {
  bookSlug: string
  chapter: number
  verse: number
  phrase: string
  text: string
  color?: PenId
  subject?: string
}) {
  const userId = await currentUserId()
  if (!userId || !supabase) return undefined
  const phrase = note.phrase.trim()
  const text = note.text.trim()
  if (!phrase || !text) return undefined
  const siblings = notesForVerse(note.bookSlug, note.chapter, note.verse)
  const markLabel = mineGlyph(siblings.length, siblings.length + 1)
  const { data, error } = await supabase
    .from('user_notes')
    .insert({
      user_id: userId,
      book: note.bookSlug,
      chapter: note.chapter,
      verse: note.verse,
      phrase,
      color: note.color ?? null,
      mark_label: markLabel,
      body: text,
      subject: note.subject?.trim() || null,
    })
    .select('id, created_at')
    .single()
  if (error || !data) {
    void loadFromCloud(userId)
    return undefined
  }
  const entry: UserNote = {
    id: data.id,
    bookSlug: note.bookSlug,
    chapter: note.chapter,
    verse: note.verse,
    phrase,
    text,
    color: note.color,
    markLabel,
    subject: note.subject?.trim() || undefined,
    createdAt: stamp(data.created_at),
  }
  setState({ ...state, notes: [...state.notes, entry] })
  await relabelVerseNotes(userId, note.bookSlug, note.chapter, note.verse)
  return getMarks().notes.find((n) => n.id === entry.id) ?? entry
}

export async function removeNote(id: string) {
  const userId = await currentUserId()
  if (!userId || !supabase) return
  const existing = state.notes.find((n) => n.id === id)
  setState({ ...state, notes: state.notes.filter((n) => n.id !== id) })
  await supabase.from('user_notes').delete().eq('id', id).eq('user_id', userId)
  if (existing) {
    await relabelVerseNotes(userId, existing.bookSlug, existing.chapter, existing.verse)
  }
}

export function highlightsForVerse(bookSlug: string, chapter: number, verse: number) {
  return state.highlights.filter(
    (h) => h.bookSlug === bookSlug && h.chapter === chapter && h.verse === verse,
  )
}

export function notesForVerse(bookSlug: string, chapter: number, verse: number) {
  return state.notes
    .filter((n) => n.bookSlug === bookSlug && n.chapter === chapter && n.verse === verse)
    .sort((a, b) => a.createdAt - b.createdAt)
}

export function washesForVerse(bookSlug: string, chapter: number, verse: number) {
  const byPhrase = new Map<string, { phrase: string; color: string }>()
  for (const n of notesForVerse(bookSlug, chapter, verse)) {
    if (!n.color) continue
    byPhrase.set(n.phrase.toLowerCase(), { phrase: n.phrase, color: penMeta(n.color).wash })
  }
  for (const h of highlightsForVerse(bookSlug, chapter, verse)) {
    byPhrase.set(h.phrase.toLowerCase(), { phrase: h.phrase, color: penMeta(h.color).wash })
  }
  return [...byPhrase.values()]
}

export function mineGlyph(indexInVerse: number, total: number) {
  if (total <= 1) return '★'
  return String(indexInVerse + 1)
}

export function formatMarkRef(bookSlug: string, chapter: number, verse: number) {
  return `${bookName(bookSlug)} ${chapter}:${verse}`
}

export function noteHref(n: UserNote) {
  return `/bible/${n.bookSlug}/${n.chapter}/${n.verse}?tab=mine&note=${n.id}`
}

export function highlightHref(h: Highlight) {
  return `/bible/${h.bookSlug}/${h.chapter}/${h.verse}?tab=mine&highlight=${h.id}`
}

export function bookmarkHref(b: Bookmark) {
  return `/bible/${b.bookSlug}/${b.chapter}/${b.verse}`
}

export function useMarks() {
  return useSyncExternalStore(subscribeMarks, getMarks, () => EMPTY)
}
