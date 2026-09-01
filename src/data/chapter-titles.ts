import data from './chapter-titles.json' with { type: 'json' }

type Payload = {
  source: string
  books: Record<string, string[]>
}

const payload = data as Payload

export const CHAPTER_TITLE_SOURCE =
  'Chapter lines from Matthew Henry’s Exposition (1706–1721), public domain.'

export function chapterTitlesFor(bookSlug: string): string[] {
  return payload.books[bookSlug] ?? []
}
