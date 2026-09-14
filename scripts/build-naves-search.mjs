/**
 * Add compact search keys (related names + label words) to naves-index.json
 * from the already-built naves-topics dumps.
 *
 *   node scripts/build-naves-search.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { topicKeys } from './naves-keys.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const topicDir = join(root, 'src', 'data', 'naves-topics')
const indexPath = join(root, 'src', 'data', 'naves-index.json')

const keysBySlug = new Map()
for (const file of readdirSync(topicDir)) {
  if (!file.endsWith('.json')) continue
  const payload = JSON.parse(readFileSync(join(topicDir, file), 'utf8'))
  for (const t of payload.topics ?? []) {
    const keys = topicKeys(t.related, t.subtopics)
    if (keys) keysBySlug.set(t.slug, keys)
  }
}

const index = JSON.parse(readFileSync(indexPath, 'utf8'))
index.topics = (index.topics ?? []).map((t) => {
  const keys = keysBySlug.get(t.slug)
  if (!keys) {
    const { keys: _drop, ...rest } = t
    return rest
  }
  return { ...t, keys }
})

writeFileSync(indexPath, `${JSON.stringify(index)}\n`)
console.log(`Nave search keys: ${keysBySlug.size} of ${index.topics.length} topics`)
