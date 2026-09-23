import { useEffect, useState } from 'react'
import {
  currentOfflineStatus,
  downloadOfflinePack,
  mbLabel,
  type OfflineStatus,
} from '../lib/offline'

function statusLine(s: OfflineStatus) {
  const size = s.mb > 0 ? ` About ${mbLabel(s.mb)}.` : ''
  switch (s.state) {
    case 'unsupported':
      return s.detail ?? 'This browser cannot save the Bible for offline use.'
    case 'saving':
      return `Saving ${s.done} of ${s.total}… Keep this page open.`
    case 'ready':
      return 'Saved on this device. You can read with no signal.'
    case 'stale':
      return `A newer copy is on the site.${size} Download again while you have a signal.`
    case 'error':
      return s.detail ?? 'The download did not finish. Try again on Wi-Fi.'
    default:
      return `This saves the Bible and the notes on this device.${size} Use Wi-Fi.`
  }
}

export function OfflinePack() {
  const [status, setStatus] = useState<OfflineStatus>({
    state: 'need',
    done: 0,
    total: 0,
    mb: 0,
  })

  useEffect(() => {
    let alive = true
    void currentOfflineStatus().then((s) => {
      if (alive) setStatus(s)
    })
    return () => {
      alive = false
    }
  }, [])

  const busy = status.state === 'saving'
  const label =
    status.state === 'ready' ? 'Download again' : status.state === 'stale' ? 'Download again' : 'Download for offline'

  async function save() {
    setStatus((s) => ({ ...s, state: 'saving', done: 0 }))
    try {
      await downloadOfflinePack(setStatus)
    } catch {
      setStatus((s) => ({
        ...s,
        state: 'error',
        detail: 'The download did not finish. Try again on Wi-Fi.',
      }))
    }
  }

  return (
    <>
      <h2>Use without the internet</h2>
      <p>
        Download the Bible and the notes onto this phone or computer. When it says Saved, you can
        read with the signal off. After you Refresh a new version, download again. Sign in, Translate,
        the magazine, and the store still need the internet.
      </p>
      <p>{statusLine(status)}</p>
      {status.state === 'unsupported' ? null : (
        <p>
          <button type="button" className="listen-btn" disabled={busy} onClick={() => void save()}>
            {busy ? 'Saving…' : label}
          </button>
        </p>
      )}
    </>
  )
}
