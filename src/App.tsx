import { useEffect, useRef, useState, type FormEvent } from 'react'
import { parsePath, type Route } from './router'
import { parseRef } from './data/kjv'
import { auditScofieldPhrases } from './data/scofield'
import { AuthProvider, useAuth } from './lib/auth'
import { MAGAZINE_BLURB, MAGAZINE_LABEL, MAGAZINE_URL, STORE_URL, SUPPORT_EMAIL, TAGLINE } from './data/starters'
import { HomePage } from './pages/HomePage'
import { TopicsPage } from './pages/TopicsPage'
import { TopicPage } from './pages/TopicPage'
import { BiblePage } from './pages/BiblePage'
import { BookPage } from './pages/BookPage'
import { VersePage } from './pages/VersePage'
import { NotebookPage } from './pages/NotebookPage'
import { SettingsPage } from './pages/SettingsPage'
import { AboutPage } from './pages/AboutPage'
import { LoginPage } from './pages/LoginPage'
import { TranslateControl, TranslateFooterLink } from './components/TranslateControl'
import { reloadApp, useAppUpdate } from './lib/appUpdate'

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
  title,
  'aria-current': ariaCurrent,
  'aria-label': ariaLabel,
  'data-go': dataGo,
}: {
  to: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  title?: string
  'aria-current'?: 'page' | undefined
  'aria-label'?: string
  'data-go'?: string
}) {
  return (
    <a
      href={to}
      className={className}
      title={title}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      data-go={dataGo}
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
  const loc = useLocation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [loc.pathname, loc.search])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
  }, [open])

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
      {open ? (
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="John 3:16 or a word"
          aria-label="Search a verse or word"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      ) : (
        <button
          type="button"
          className="header-search-gate"
          onClick={() => setOpen(true)}
        >
          John 3:16 or a word
        </button>
      )}
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
    case 'bible':
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
    case 'about':
      return <AboutPage />
    case 'login':
      return <LoginPage search={search} />
  }
}

function MastNav() {
  const { user, signOut } = useAuth()
  return (
    <nav className="mast-nav" aria-label="Account">
      <TranslateControl />
      <button type="button" className="mast-auth" onClick={() => void reloadApp()}>
        Refresh
      </button>
      <Link to="/settings">Settings</Link>
      <Link to="/about">About</Link>
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
  return name === 'home' || name === 'bible' || name === 'book' || name === 'chapter' || name === 'verse'
}

function topicsOn(name: Route['name']) {
  return name === 'topics' || name === 'topic'
}

function Dock({ routeName }: { routeName: Route['name'] }) {
  return (
    <nav className="dock" aria-label="Main">
      <Link to="/" className={bibleOn(routeName) ? 'on' : undefined} aria-current={bibleOn(routeName) ? 'page' : undefined}>
        Home
      </Link>
      <Link to="/about" className={routeName === 'about' ? 'on' : undefined} aria-current={routeName === 'about' ? 'page' : undefined}>
        About
      </Link>
      <Link to="/topics" className={topicsOn(routeName) ? 'on' : undefined} aria-current={topicsOn(routeName) ? 'page' : undefined}>
        Topics
      </Link>
      <a
        href={MAGAZINE_URL}
        className="dock-mag"
        target="_blank"
        rel="noopener noreferrer"
        title={MAGAZINE_BLURB}
      >
        {MAGAZINE_LABEL}
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
  const { updateReady, refresh } = useAppUpdate()

  useEffect(() => {
    auditScofieldPhrases()
  }, [])

  return (
    <div className="app">
      <header className="masthead">
        <Link to="/" className="brand">
          <img className="brand-mark" src="/logo.png" width="40" height="40" alt="" />
          <span className="brand-name">Walking By Faith</span>
          <span className="brand-tag">{TAGLINE}</span>
        </Link>
        <HeaderSearch />
        <MastNav />
      </header>
      {updateReady ? (
        <div className="update-bar" role="status">
          <p>A new version is ready.</p>
          <button type="button" onClick={() => void refresh()}>
            Refresh
          </button>
        </div>
      ) : null}
      <main>
        <Screen route={route} search={loc.search} hash={loc.hash} />
      </main>
      <div className="bottom-chrome">
        <Dock routeName={route.name} />
        <footer>
          <p>
            <a href={MAGAZINE_URL} target="_blank" rel="noopener noreferrer" title={MAGAZINE_BLURB}>
              A companion to Walking By Faith Magazine
            </a>
          </p>
          <p className="fine">
            <Link to="/settings">How to use</Link>
            {' · '}
            <TranslateFooterLink />
            {' · '}
            © 2026 Skyland Publishing – Skyland Reach LLC
          </p>
          <p className="fine">
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </p>
        </footer>
      </div>
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
