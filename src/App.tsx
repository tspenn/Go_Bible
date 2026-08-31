import { useEffect, useState } from 'react'
import { parsePath, type Route } from './router'
import { HomePage } from './pages/HomePage'
import { TopicsPage } from './pages/TopicsPage'
import { TopicPage } from './pages/TopicPage'
import { BiblePage } from './pages/BiblePage'
import { VersePage } from './pages/VersePage'

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
}: {
  to: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        navigate(to)
      }}
    >
      {children}
    </a>
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
      return <TopicsPage />
    case 'topic':
      return <TopicPage slug={route.slug} />
    case 'bible':
      return <BiblePage />
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
  }
}

export default function App() {
  const loc = useLocation()
  const route = parsePath(loc.pathname)

  return (
    <div className="app">
      <header className="masthead">
        <Link to="/" className="brand">
          <span className="brand-name">Look Up</span>
          <span className="brand-sub">Walking By Faith Companion</span>
        </Link>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/topics">Topics</Link>
          <Link to="/bible">Bible</Link>
          <a href="https://faith.skylandpublishing.com/catalog" className="shop">
            Shop
          </a>
        </nav>
      </header>
      <main>
        <Screen route={route} search={loc.search} hash={loc.hash} />
      </main>
      <footer>
        <p>A companion to Walking By Faith · Skyland Publishing – Skyland Reach LLC</p>
        <p className="fine">
          Nave’s Topical Bible is public domain. Go-Bible text, based on the World
          English Bible (public domain). Divine name rendered LORD.
        </p>
        <p className="fine">© 2026 Skyland Publishing – Skyland Reach LLC</p>
      </footer>
    </div>
  )
}
