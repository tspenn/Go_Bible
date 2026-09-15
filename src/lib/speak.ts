import { useSyncExternalStore } from 'react'
import { nextChapter, versesInChapter, type Verse } from '../data/kjv'

export type SpeakStatus = 'idle' | 'playing' | 'paused'
export type ListenGender = 'male' | 'female'

export type SpeakState = {
  status: SpeakStatus
  verse: number | null
  voiceName: string | null
  supported: boolean
}

const IDLE: SpeakState = { status: 'idle', verse: null, voiceName: null, supported: false }

let state: SpeakState = {
  ...IDLE,
  supported: typeof window !== 'undefined' && 'speechSynthesis' in window,
}
const listeners = new Set<() => void>()
let gen = 0
let index = 0
let queue: { verse: number | null; text: string }[] = []
let current: SpeechSynthesisUtterance | null = null
let picked: SpeechSynthesisVoice | null = null
let follow: { bookSlug: string; chapter: number } | null = null

function emit() {
  listeners.forEach((fn) => fn())
}

function setState(next: Partial<SpeakState>) {
  state = { ...state, ...next }
  emit()
}

function isBritish(voice: SpeechSynthesisVoice) {
  const blob = `${voice.lang} ${voice.name}`.toLowerCase()
  return (
    voice.lang.toLowerCase().startsWith('en-gb') ||
    blob.includes('en-uk') ||
    blob.includes('uk english') ||
    blob.includes('united kingdom') ||
    blob.includes('british')
  )
}

function isUs(voice: SpeechSynthesisVoice) {
  const lang = voice.lang.toLowerCase()
  const name = voice.name.toLowerCase()
  return (
    lang.startsWith('en-us') ||
    name.includes('us english') ||
    name.includes('united states') ||
    name.includes('american')
  )
}

const MALE_HINTS = [
  'david',
  'mark',
  'guy',
  'andrew',
  'christopher',
  'eric',
  'steffan',
  'james',
  'john',
  'tom',
  'alex',
  'fred',
  'ryan',
  'roger',
  'george',
  'richard',
  'daniel',
  'brian',
  'arthur',
  'thomas',
  'michael',
  'matthew',
]
const FEMALE_HINTS = [
  'zira',
  'aria',
  'jenny',
  'samantha',
  'susan',
  'michelle',
  'jane',
  'eva',
  'sara',
  'linda',
  'hazel',
  'heather',
  'catherine',
  'karen',
  'moira',
  'fiona',
  'victoria',
]

function voiceBlob(voice: SpeechSynthesisVoice) {
  return `${voice.lang} ${voice.name} ${voice.voiceURI}`.toLowerCase()
}

function isGoogleUsEnglish(voice: SpeechSynthesisVoice) {
  return /google\s*us\s*english/i.test(`${voice.name} ${voice.voiceURI}`)
}

function namedGender(voice: SpeechSynthesisVoice): ListenGender | null {
  const blob = voiceBlob(voice)
  if (/\bfemale\b/.test(blob) || /x-sfg|x-tpf|x-tfb|sm_f/.test(blob)) return 'female'
  if (isGoogleUsEnglish(voice) && !/\bmale\b/.test(blob)) return 'female'
  if (/\bmale\b/.test(blob) || /x-iol|x-tpd|x-gid|sm_m/.test(blob)) return 'male'
  if (FEMALE_HINTS.some((h) => blob.includes(h))) return 'female'
  if (MALE_HINTS.some((h) => blob.includes(h))) return 'male'
  return null
}

function scoreVoice(voice: SpeechSynthesisVoice, want: ListenGender) {
  const g = namedGender(voice)
  let n = 0
  if (g === want) n += 100
  if (g && g !== want) n -= 250
  if (isUs(voice)) n += 35
  if (isBritish(voice)) n -= 15
  if (want === 'male' && isGoogleUsEnglish(voice)) n -= 80
  if (voice.localService && g === want) n += 6
  return n
}

function pickUsVoice(voices: SpeechSynthesisVoice[], want: ListenGender) {
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'))
  const pool = english.length ? english : voices
  if (!pool.length) return null
  const matching = pool.filter((v) => namedGender(v) === want)
  const unknown = pool.filter((v) => namedGender(v) == null)
  const candidates = matching.length ? matching : unknown.length ? unknown : pool
  let best = candidates[0]
  let bestScore = -Infinity
  for (const voice of candidates) {
    const n = scoreVoice(voice, want)
    if (n > bestScore) {
      best = voice
      bestScore = n
    }
  }
  return best ?? null
}

function liveVoice() {
  if (!picked) return null
  const list = speechSynthesis.getVoices()
  return (
    list.find((v) => v.voiceURI === picked!.voiceURI && v.name === picked!.name) ??
    list.find((v) => v.voiceURI === picked!.voiceURI) ??
    picked
  )
}

function utterRate(voice: SpeechSynthesisVoice | null) {
  if (listenGender === 'female') return 0.7
  const name = voice?.name.toLowerCase() ?? ''
  if (name.includes('google')) return 1
  return 1.08
}

const GENDER_KEY = 'go-bible-listen-gender'
const genderListeners = new Set<() => void>()

function readGender(): ListenGender {
  try {
    return localStorage.getItem(GENDER_KEY) === 'female' ? 'female' : 'male'
  } catch {
    return 'male'
  }
}

let listenGender: ListenGender = typeof localStorage !== 'undefined' ? readGender() : 'male'

function emitGender() {
  genderListeners.forEach((fn) => fn())
}

export function getListenGender() {
  return listenGender
}

export function setListenGender(next: ListenGender) {
  listenGender = next
  picked = null
  try {
    localStorage.setItem(GENDER_KEY, next)
  } catch {
    /* ignore quota / private mode */
  }
  emitGender()
}

export function subscribeListenGender(fn: () => void) {
  genderListeners.add(fn)
  return () => genderListeners.delete(fn)
}

export function useListenGender() {
  return useSyncExternalStore(subscribeListenGender, getListenGender, () => 'male' as ListenGender)
}

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve([])
  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      speechSynthesis.removeEventListener('voiceschanged', onChange)
      resolve(speechSynthesis.getVoices())
    }
    const onChange = () => {
      if (speechSynthesis.getVoices().length > 1) window.setTimeout(finish, 50)
    }
    speechSynthesis.addEventListener('voiceschanged', onChange)
    if (speechSynthesis.getVoices().length > 1) {
      window.setTimeout(finish, 50)
      return
    }
    window.setTimeout(finish, 1500)
  })
}

export function warmupVoices() {
  void loadVoices()
}

function hardCancel() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  speechSynthesis.cancel()
}

let keepAlive = 0

function clearKeepAlive() {
  if (!keepAlive) return
  window.clearInterval(keepAlive)
  keepAlive = 0
}

function armKeepAlive() {
  if (typeof window === 'undefined' || keepAlive) return
  keepAlive = window.setInterval(() => {
    if (state.status !== 'playing') {
      clearKeepAlive()
      return
    }
    if (speechSynthesis.speaking || speechSynthesis.pending) return
    speakNext(gen)
  }, 1500)
}

/** Kill leftover Chrome utterances only when Listen is already idle or paused. */
function hushZombies() {
  if (state.status === 'playing') return
  hardCancel()
}

/** If we are still supposed to be reading, pick the chapter back up after a tab switch. */
function kickIfStalled() {
  if (state.status !== 'playing') {
    hushZombies()
    return
  }
  if (speechSynthesis.speaking || speechSynthesis.pending) return
  speakNext(gen)
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hushZombies()
    else kickIfStalled()
  })
  window.addEventListener('pageshow', kickIfStalled)
  window.addEventListener('focus', kickIfStalled)
  window.addEventListener('blur', hushZombies)
  window.addEventListener('pagehide', hushZombies)
}

export function stopSpeak() {
  gen += 1
  clearKeepAlive()
  if (current) {
    current.onend = null
    current.onerror = null
    current = null
  }
  queue = []
  index = 0
  follow = null
  hardCancel()
  setState({ status: 'idle', verse: null })
}

export function pauseSpeak() {
  if (state.status !== 'playing') return
  clearKeepAlive()
  if (current) {
    current.onend = null
    current.onerror = null
    current = null
  }
  hardCancel()
  setState({ status: 'paused' })
}

export function resumeSpeak() {
  if (state.status !== 'paused') return
  if (!queue.length) {
    stopSpeak()
    return
  }
  setState({ status: 'playing' })
  armKeepAlive()
  speakNext(gen)
}

function chapterItems(
  bookName: string,
  chapter: number,
  verses: Pick<Verse, 'verse' | 'text'>[],
  fromVerse: number,
) {
  const from = fromVerse > 1 ? fromVerse : 1
  const slice = verses.filter((v) => v.verse >= from)
  const intro =
    from > 1
      ? `${bookName}, chapter ${chapter}, from verse ${from}.`
      : `${bookName}, chapter ${chapter}.`
  return [{ verse: null, text: intro }, ...slice.map((v) => ({ verse: v.verse, text: v.text }))]
}

function appendNextChapter() {
  if (!follow) return false
  const nxt = nextChapter(follow.bookSlug, follow.chapter)
  if (!nxt) {
    follow = null
    return false
  }
  const verses = versesInChapter(nxt.bookSlug, nxt.chapter)
  if (!verses.length) {
    follow = nxt
    return appendNextChapter()
  }
  follow = { bookSlug: nxt.bookSlug, chapter: nxt.chapter }
  queue = queue.concat(chapterItems(nxt.bookName, nxt.chapter, verses, 1))
  return true
}

function speakNext(token: number) {
  if (token !== gen) return
  if (index >= queue.length) {
    if (appendNextChapter()) {
      speakNext(token)
      return
    }
    current = null
    queue = []
    index = 0
    follow = null
    clearKeepAlive()
    setState({ status: 'idle', verse: null })
    return
  }
  const item = queue[index]
  const voice = liveVoice()
  const utter = new SpeechSynthesisUtterance(item.text)
  utter.lang = voice?.lang || 'en-US'
  utter.rate = utterRate(voice)
  utter.pitch = 1
  utter.voice = voice
  utter.onend = () => {
    if (token !== gen) return
    if (state.status !== 'playing') return
    index += 1
    speakNext(token)
  }
  utter.onerror = (e) => {
    if (token !== gen) return
    if (state.status !== 'playing') return
    const err = 'error' in e ? String(e.error) : ''
    // Pause/Stop cancel on purpose. Chrome also "interrupts" when you switch apps —
    // keep going so Listen can read in the background.
    if (err === 'canceled') return
    if (err === 'interrupted' && typeof document !== 'undefined' && document.hidden) return
    index += 1
    speakNext(token)
  }
  current = utter
  armKeepAlive()
  setState({
    status: 'playing',
    verse: item.verse,
    voiceName: voice?.name ?? null,
  })
  window.setTimeout(() => {
    if (token !== gen) return
    if (state.status !== 'playing') return
    speechSynthesis.speak(utter)
  }, 60)
}

async function beginSpeak(nextQueue: { verse: number | null; text: string }[]) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  if (!nextQueue.length) return
  const token = ++gen
  if (current) {
    current.onend = null
    current.onerror = null
    current = null
  }
  queue = []
  index = 0
  hardCancel()
  const voices = await loadVoices()
  if (token !== gen) return
  picked = pickUsVoice(voices, listenGender)
  queue = nextQueue
  setState({
    status: 'playing',
    verse: nextQueue.find((item) => item.verse != null)?.verse ?? null,
    voiceName: picked?.name ?? null,
    supported: true,
  })
  speakNext(token)
}

export async function startChapterSpeak(opts: {
  bookName: string
  chapter: number
  verses: Pick<Verse, 'verse' | 'text'>[]
  fromVerse?: number
}) {
  follow = null
  const from = opts.fromVerse && opts.fromVerse > 1 ? opts.fromVerse : 1
  await beginSpeak(chapterItems(opts.bookName, opts.chapter, opts.verses, from))
}

export async function startFromVerseSpeak(opts: {
  bookSlug: string
  bookName: string
  chapter: number
  fromVerse: number
}) {
  const verses = versesInChapter(opts.bookSlug, opts.chapter)
  if (!verses.length) return
  follow = { bookSlug: opts.bookSlug, chapter: opts.chapter }
  await beginSpeak(chapterItems(opts.bookName, opts.chapter, verses, opts.fromVerse))
}

export function getSpeak() {
  return state
}

export function subscribeSpeak(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useSpeak() {
  return useSyncExternalStore(subscribeSpeak, getSpeak, () => IDLE)
}
