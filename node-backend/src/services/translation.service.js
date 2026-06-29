const MYMEMORY_URL = 'https://api.mymemory.translated.net/get'
const SUPPORTED_LOCALES = ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'zh-CN', 'ja-JP']
const DEFAULT_LOCALE = 'pt-BR'
const REQUEST_TIMEOUT_MS = 5000
const TOTAL_TIMEOUT_MS = 10000

async function translateOne(text, sourceLocale, targetLocale) {
  const params = new URLSearchParams({ q: text, langpair: `${sourceLocale}|${targetLocale}` })
  const url = `${MYMEMORY_URL}?${params}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, { signal: controller.signal })
    const data = await response.json()

    if (data.responseStatus === 429) {
      throw new Error(`MyMemory daily limit reached for ${targetLocale}`)
    }

    const translated = data?.responseData?.translatedText
    if (typeof translated !== 'string' || !translated.trim()) {
      throw new Error(`Empty translation received for ${targetLocale}`)
    }

    return { locale: targetLocale, text: translated.trim() }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Translates text to all supported locales using MyMemory API.
 * Returns { locale: translatedText } including the source locale.
 * Returns {} if all translations fail.
 */
export async function translateToAllLocales(text, sourceLocale) {
  const targetLocales = SUPPORTED_LOCALES.filter((l) => l !== sourceLocale)
  const result = { [sourceLocale]: text }

  const totalTimeout = new Promise((resolve) => setTimeout(resolve, TOTAL_TIMEOUT_MS))

  const individualRequests = targetLocales.map(async (locale) => {
    try {
      const outcome = await translateOne(text, sourceLocale, locale)
      result[outcome.locale] = outcome.text
    } catch (err) {
      console.warn(`[translation] ${locale} failed for "${text.slice(0, 40)}...": ${err.message}`)
    }
  })

  await Promise.race([Promise.allSettled(individualRequests), totalTimeout])

  return result
}

export { DEFAULT_LOCALE, SUPPORTED_LOCALES }
