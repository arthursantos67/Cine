const SUPPORTED_LOCALES = ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'zh-CN', 'ja-JP']
const DEFAULT_LOCALE = 'pt-BR'

function parseAcceptLanguage(header) {
  if (!header) return DEFAULT_LOCALE

  const parts = header.split(',').map((part) => {
    const [lang, q] = part.trim().split(';q=')
    return { lang: lang.trim(), q: q ? parseFloat(q) : 1.0 }
  })

  parts.sort((a, b) => b.q - a.q)

  for (const { lang } of parts) {
    const normalized = lang.trim().toLowerCase().replace('_', '-')
    const exact = SUPPORTED_LOCALES.find((l) => l.toLowerCase() === normalized)
    if (exact) return exact

    const prefix = normalized.split('-')[0]
    const prefixMatch = SUPPORTED_LOCALES.find((l) => l.toLowerCase().startsWith(prefix + '-'))
    if (prefixMatch) return prefixMatch
  }

  return DEFAULT_LOCALE
}

export function localeMiddleware(req, _res, next) {
  req.locale = parseAcceptLanguage(req.headers['accept-language'])
  next()
}
