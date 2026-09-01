import { useSyncExternalStore } from 'react'
import type { Verse } from '../data/kjv'

export type SpeakStatus = 'idle' | 'playing' | 'paused'

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

const PREFERRED = [
  'google us english',
  'microsoft david',
  'microsoft mark',
  'microsoft zira',
  'microsoft aria',
  'microsoft guy',
  'microsoft andrew',
  'microsoft jenny',
  'samantha',
  'alex',
]

function pickUsVoice(voices: SpeechSynthesisVoice[]) {
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'))
  const us = english.filter(isUs)
  const notBritish = english.filter((v) => !isBritish(v))
  const pool = us.length ? us : notBritish.length ? notBritish : english
  for (const want of PREFERRED) {
    const hit = pool.find((v) => v.name.toLowerCase().includes(want))
    if (hit && !isBritish(hit)) return hit
  }
  return pool.find((v) => v.default && !isBritish(v)) ?? pool[0] ?? null
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
  utter.rate = 0.95
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
  speechSynthesis.speak(utter)
}

export async function startChapterSpeak(opts: {
  bookName: string
  chapter: number
  verses: Pick<Verse, 'verse' | 'text'>[]
  fromVerse?: number
}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
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
  picked = pickUsVoice(voices)
  const from = opts.fromVerse && opts.fromVerse > 1 ? opts.fromVerse : 1
  const slice = opts.verses.filter((v) => v.verse >= from)
  const intro =
    from > 1
      ? `${opts.bookName}, chapter ${opts.chapter}, from verse ${from}.`
      : `${opts.bookName}, chapter ${opts.chapter}.`
  queue = [{ verse: null, text: intro }, ...slice.map((v) => ({ verse: v.verse, text: v.text }))]
  setState({
    status: 'playing',
    verse: null,
    voiceName: picked?.name ?? null,
    supported: true,
  })
  speakNext(token)
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
