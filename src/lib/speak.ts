import { useSyncExternalStore } from 'react'
import type { Verse } from '../data/kjv'

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
  if (/\bfemale\b/.test(blob) || isGoogleUsEnglish(voice)) return 'female'
  if (/\bmale\b/.test(blob)) return 'male'
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
  let best = pool[0]
  let bestScore = -Infinity
  for (const voice of pool) {
    const n = scoreVoice(voice, want)
    if (n > bestScore) {
      best = voice
      bestScore = n
    }
  }
  return best ?? null
}

function utterRate(voice: SpeechSynthesisVoice | null) {
  if (listenGender === 'female') return 0.7
  const name = voice?.name.toLowerCase() ?? ''
  if (name.includes('google')) return 0.82
  return 0.9
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
  const now = speechSynthesis.getVoices()
  if (now.length) return Promise.resolve(now)
  return new Promise((resolve) => {
    const finish = () => {
      speechSynthesis.removeEventListener('voiceschanged', finish)
      resolve(speechSynthesis.getVoices())
    }
    speechSynthesis.addEventListener('voiceschanged', finish)
    window.setTimeout(finish, 700)
  })
}

export function stopSpeak() {
  gen += 1
  if (current) {
    current.onend = null
    current.onerror = null
    current = null
  }
  queue = []
  index = 0
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) speechSynthesis.cancel()
  setState({ status: 'idle', verse: null })
}

export function pauseSpeak() {
  if (state.status !== 'playing') return
  speechSynthesis.pause()
  setState({ status: 'paused' })
}

export function resumeSpeak() {
  if (state.status !== 'paused') return
  speechSynthesis.resume()
  setState({ status: 'playing' })
}

function speakNext(token: number) {
  if (token !== gen) return
  if (index >= queue.length) {
    current = null
    queue = []
    index = 0
    setState({ status: 'idle', verse: null })
    return
  }
  const item = queue[index]
  const utter = new SpeechSynthesisUtterance(item.text)
  utter.voice = picked
  utter.lang = picked?.lang || 'en-US'
  utter.rate = utterRate(picked)
  utter.pitch = 1
  utter.onend = () => {
    if (token !== gen) return
    index += 1
    speakNext(token)
  }
  utter.onerror = () => {
    if (token !== gen) return
    index += 1
    speakNext(token)
  }
  current = utter
  setState({
    status: 'playing',
    verse: item.verse,
    voiceName: picked?.name ?? null,
  })
  window.setTimeout(() => {
    if (token !== gen) return
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
  speechSynthesis.cancel()
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
  const from = opts.fromVerse && opts.fromVerse > 1 ? opts.fromVerse : 1
  const slice = opts.verses.filter((v) => v.verse >= from)
  const intro =
    from > 1
      ? `${opts.bookName}, chapter ${opts.chapter}, from verse ${from}.`
      : `${opts.bookName}, chapter ${opts.chapter}.`
  await beginSpeak([{ verse: null, text: intro }, ...slice.map((v) => ({ verse: v.verse, text: v.text }))])
}

export async function startPassagesSpeak(opts: {
  intro?: string
  passages: { cite: string; text: string }[]
}) {
  if (!opts.passages.length) return
  await beginSpeak([
    ...(opts.intro ? [{ verse: null, text: opts.intro }] : []),
    ...opts.passages.map((p) => ({ verse: null, text: `${p.cite}. ${p.text}` })),
  ])
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
