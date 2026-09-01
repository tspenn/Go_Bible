import { useEffect, useState, type FormEvent } from 'react'
import { parsePath, type Route } from './router'
import { parseRef } from './data/kjv'
import { auditScofieldPhrases } from './data/scofield'
import { AuthProvider, useAuth } from './lib/auth'
import { MAGAZINE_URL, STORE_URL } from './data/starters'
import { HomePage } from './pages/HomePage'
import { TopicsPage } from './pages/TopicsPage'
import { TopicPage } from './pages/TopicPage'
import { BiblePage } from './pages/BiblePage'
import { BookPage } from './pages/BookPage'
import { VersePage } from './pages/VersePage'
import { NotebookPage } from './pages/NotebookPage'
import { SettingsPage } from './pages/SettingsPage'
import { LoginPage } from './pages/LoginPage'

function useLocation() {
  const [loc, setLoc] = useState(() => ({
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  }))

  useEffect(() => {
    const onPop = () =>
      setLoc({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      })
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return loc
}

export function navigate(to: string) {
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function Link({
  to,
  children,
  className,
  onClick,
  'aria-current': ariaCurrent,
}: {
  to: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  'aria-current'?: 'page' | undefined
}) {
  return (
    <a
      href={to}
      className={className}
      aria-current={ariaCurrent}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        onClick?.()
        navigate(to)
      }}
    >
      {children}
    </a>
  )
}

function HeaderSearch() {
  const [q, setQ] = useState('')

  function go(e: FormEvent) {
    e.preventDefault()
    const ref = parseRef(q)
    if (ref) {
      navigate(`/bible/${ref.bookSlug}/${ref.chapter}/${ref.verse}`)
      return
    }
    const trimmed = q.trim()
    navigate(trimmed ? `/topics?q=${encodeURIComponent(trimmed)}` : '/topics')
  }

  return (
    <form className="header-search" onSubmit={go} role="search">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="John 3:16 or a topic"
        aria-label="Search a verse or topic"
        enterKeyHint="search"
      />
      <button type="submit" className="sr-only">
        Search
      </button>
    </form>
  )
}

function Screen({
  route,
  search,
  hash,
}: {
  route: Route
  search: string
  hash: string
}) {
  switch (route.name) {
    case 'home':
      return <HomePage />
    case 'topics':
      return <TopicsPage search={search} />
    case 'topic':
      return <TopicPage slug={route.slug} />
    case 'bible':
      return <BiblePage />
    case 'book':
      return <BookPage bookSlug={route.bookSlug} />
    case 'chapter':
      return (
        <VersePage
          bookSlug={route.bookSlug}
          chapter={route.chapter}
          search={search}
          hash={hash}
        />
      )
    case 'verse':
      return (
        <VersePage
          bookSlug={route.bookSlug}
          chapter={route.chapter}
          verse={route.verse}
          search={search}
          hash={hash}
        />
      )
    case 'notebook':
      return <NotebookPage />
    case 'settings':
      return <SettingsPage />
    case 'login':
      return <LoginPage search={search} />
  }
}

function MastNav() {
  const { user, signOut } = useAuth()
  return (
    <nav className="mast-nav" aria-label="Account">
      <Link to="/settings">Settings</Link>
      {user ? <Link to="/notebook">Notebook</Link> : null}
      {user ? (
        <button type="button" className="mast-auth" onClick={() => void signOut().then(() => navigate('/'))}>
          Sign out
        </button>
      ) : (
        <Link to="/login">Sign in</Link>
      )}
    </nav>
  )
}

function bibleOn(name: Route['name']) {
  return name === 'bible' || name === 'book' || name === 'chapter' || name === 'verse'
}

function topicsOn(name: Route['name']) {
  return name === 'topics' || name === 'topic'
}

function Dock({ routeName }: { routeName: Route['name'] }) {
  return (
    <nav className="dock" aria-label="Main">
      <Link to="/bible" className={bibleOn(routeName) ? 'on' : undefined} aria-current={bibleOn(routeName) ? 'page' : undefined}>
        Bible
      </Link>
      <Link to="/topics" className={topicsOn(routeName) ? 'on' : undefined} aria-current={topicsOn(routeName) ? 'page' : undefined}>
        Topics
      </Link>
      <a href={MAGAZINE_URL} target="_blank" rel="noopener noreferrer">
        Walking by Faith
      </a>
      <a href={STORE_URL} target="_blank" rel="noopener noreferrer">
        Store
      </a>
    </nav>
  )
}

function AppShell() {
  const loc = useLocation()
  const route = parsePath(loc.pathname)

  useEffect(() => {
    auditScofieldPhrases()
  }, [])

  return (
    <div className="app">
      <header className="masthead">
        <Link to="/" className="brand">
          <span className="brand-name">Go-Bible</span>
        </Link>
        <HeaderSearch />
        <MastNav />
      </header>
      <main>
        <Screen route={route} search={loc.search} hash={loc.hash} />
      </main>
      <footer>
        <p>A companion to Walking By Faith · Skyland Publishing – Skyland Reach LLC</p>
        <p className="fine">
          Nave’s Topical Bible, 1896, is public domain. Go-Bible text, based on the World
          English Bible (public domain). Divine name rendered LORD.
        </p>
        <p className="fine">© 2026 Skyland Publishing – Skyland Reach LLC</p>
      </footer>
      <Dock routeName={route.name} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
