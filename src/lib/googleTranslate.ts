const SCRIPT_SRC =
  'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
const CONTAINER_ID = 'google_translate_element'
const LANGUAGES = 'bn,es,fr,de,pt,hi,zh-CN,ar,ru,ja,ko,vi,tl,tr,pl,it,nl,id,th,fa,uk,ro,ms'

declare global {
  interface Window {
    googleTranslateElementInit?: () => void
    google?: {
      translate: {
        TranslateElement: new (
          options: {
            pageLanguage: string
            includedLanguages: string
            layout: number
            autoDisplay: boolean
          },
          elementId: string,
        ) => unknown
      }
    }
  }
}

export const OPEN_TRANSLATE = 'open-translate'

function widgetReady() {
  return Boolean(document.querySelector(`#${CONTAINER_ID} .goog-te-combo`))
}

export function mountGoogleTranslate() {
  const el = document.getElementById(CONTAINER_ID)
  if (!el || widgetReady()) return
  const Ctor = window.google?.translate?.TranslateElement
  if (!Ctor) return
  new Ctor(
    {
      pageLanguage: 'en',
      includedLanguages: LANGUAGES,
      layout: 1,
      autoDisplay: false,
    },
    CONTAINER_ID,
  )
}

export function loadGoogleTranslate() {
  window.googleTranslateElementInit = mountGoogleTranslate
  if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
    mountGoogleTranslate()
    return
  }
  const script = document.createElement('script')
  script.src = SCRIPT_SRC
  script.async = true
  document.body.appendChild(script)
}
