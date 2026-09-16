import { Link } from '../App'
import { linkBodyBits, type DictEntry } from '../data/dictionary'
import { henryParagraphs, henryPointClass } from '../lib/henryProse'

export function HenryProse({
  body,
  bookSlug,
  chapter,
  className,
  onDictName,
}: {
  body: string
  bookSlug: string
  chapter: number
  className?: string
  onDictName?: (entry: DictEntry, x: number, y: number) => void
}) {
  const paras = henryParagraphs(body)
  return (
    <div className={className ? `henry-prose ${className}` : 'henry-prose'}>
      {paras.map((para, pi) => (
        <p key={pi} className={henryPointClass(para)}>
          {linkBodyBits(para, bookSlug, chapter).map((bit, i) => {
            if (bit.type === 'ref') {
              return (
                <Link key={i} to={bit.href}>
                  {bit.text}
                </Link>
              )
            }
            if (bit.type === 'dict' && onDictName) {
              return (
                <button
                  key={i}
                  type="button"
                  className="dict-hit"
                  onClick={(e) => {
                    const box = e.currentTarget.getBoundingClientRect()
                    onDictName(bit.entry, box.left, box.bottom)
                  }}
                >
                  {bit.text}
                </button>
              )
            }
            return <span key={i}>{bit.text}</span>
          })}
        </p>
      ))}
    </div>
  )
}
