export type Route =
  | { name: 'home' }
  | { name: 'topics' }
  | { name: 'topic'; slug: string }
  | { name: 'bible' }
  | { name: 'verse'; bookSlug: string; chapter: number; verse: number }
  | { name: 'chapter'; bookSlug: string; chapter: number }

export function parseVerseQuery(search = '', hash = '') {
  const params = new URLSearchParams(search)
  const fragment = hash.replace(/^#/, '')
  return {
    tab: params.get('tab') ?? undefined,
    w: params.get('w') ?? undefined,
    rwpLetter: fragment.startsWith('rwp-') ? fragment.slice(4) : undefined,
  }
}

export function parsePath(pathname: string): Route {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean)

  if (parts.length === 0) return { name: 'home' }
  if (parts[0] === 'topics' && parts[1]) return { name: 'topic', slug: parts[1] }
  if (parts[0] === 'topics') return { name: 'topics' }
  if (parts[0] === 'bible' && parts[1] && parts[2] && parts[3]) {
    return {
      name: 'verse',
      bookSlug: parts[1],
      chapter: Number(parts[2]),
      verse: Number(parts[3]),
    }
  }
  if (parts[0] === 'bible' && parts[1] && parts[2]) {
    return { name: 'chapter', bookSlug: parts[1], chapter: Number(parts[2]) }
  }
  if (parts[0] === 'bible') return { name: 'bible' }
  return { name: 'home' }
}

export function href(route: Route): string {
  switch (route.name) {
    case 'home':
      return '/'
    case 'topics':
      return '/topics'
    case 'topic':
      return `/topics/${route.slug}`
    case 'bible':
      return '/bible'
    case 'chapter':
      return `/bible/${route.bookSlug}/${route.chapter}`
    case 'verse':
      return `/bible/${route.bookSlug}/${route.chapter}/${route.verse}`
  }
}

export function verseHref(ref: string): string | null {
  const m = ref.trim().match(/^(\d?\s*[A-Za-z]+)\s+(\d+):(\d+)$/)
  if (!m) return null
  const bookSlug = m[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `/bible/${bookSlug}/${m[2]}/${m[3]}`
}
