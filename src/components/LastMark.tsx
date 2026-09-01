import { Link } from '../App'

function FlagIcon() {
  return (
    <svg viewBox="0 0 12 16" width="14" height="18" aria-hidden="true">
      <path fill="currentColor" d="M2 1h8v12.5L6 11.2 2 13.5V1z" />
    </svg>
  )
}

export function LastMark({ to, label }: { to?: string; label: string }) {
  const name = `Last read, ${label}`
  const inner = (
    <>
      <FlagIcon />
      <span className="sr-only">{name}</span>
    </>
  )
  if (!to) {
    return <span className="last-mark">{inner}</span>
  }
  return (
    <Link className="last-mark" to={to}>
      {inner}
    </Link>
  )
}
