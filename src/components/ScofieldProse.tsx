import { Link } from '../App'
import { scofieldBodyBits, scofieldParagraphs, scofieldPointClass } from '../data/scofield'

export function ScofieldProse({
  body,
  bookSlug,
  chapter,
  className,
}: {
  body: string
  bookSlug: string
  chapter: number
  className?: string
}) {
  const paras = scofieldParagraphs(body)
  return (
    <div className={className ? `scofield-prose ${className}` : 'scofield-prose'}>
      {paras.map((para, pi) => (
        <p key={pi} className={scofieldPointClass(para)}>
          {scofieldBodyBits(para, bookSlug, chapter).map((bit, i) =>
            bit.type === 'ref' ? (
              <Link key={i} to={bit.href}>
                {bit.text}
              </Link>
            ) : (
              <span key={i}>{bit.text}</span>
            ),
          )}
        </p>
      ))}
    </div>
  )
}

export function scofieldHrefParts(href: string) {
  const m = href.match(/^\/bible\/([^/]+)\/(\d+)/)
  if (!m) return null
  return { bookSlug: m[1]!, chapter: Number(m[2]) }
}
