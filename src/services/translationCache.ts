/**
 * In-memory LRU translation cache.
 *
 * Avoids redundant API calls for identical text+lang+engine combinations.
 * Inspired by PDFMathTranslate's SQLite cache, but uses in-memory Map
 * for a pure-frontend PWA with no server dependency.
 */

interface CacheEntry {
  translatedText: string
  timestamp: number
}

const MAX_ENTRIES = 500
const TTL_MS = 1000 * 60 * 60 * 24 // 24 hours

const cache = new Map<string, CacheEntry>()

function makeKey(text: string, sourceLang: string, targetLang: string, engine: string): string {
  return JSON.stringify([engine, sourceLang, targetLang, text])
}

export function getCached(
  text: string,
  sourceLang: string,
  targetLang: string,
  engine: string
): string | null {
  const key = makeKey(text, sourceLang, targetLang, engine)
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > TTL_MS) {
    cache.delete(key)
    return null
  }
  // Move to end (most recently used)
  cache.delete(key)
  cache.set(key, entry)
  return entry.translatedText
}

export function setCached(
  text: string,
  sourceLang: string,
  targetLang: string,
  engine: string,
  translatedText: string
): void {
  const key = makeKey(text, sourceLang, targetLang, engine)
  cache.set(key, { translatedText, timestamp: Date.now() })
  if (cache.size > MAX_ENTRIES) {
    const evictCount = cache.size - MAX_ENTRIES
    const keys = cache.keys()
    for (let i = 0; i < evictCount; i++) {
      const oldest = keys.next().value
      if (oldest !== undefined) cache.delete(oldest)
    }
  }
}

export function clearCache(): void {
  cache.clear()
}

export function cacheSize(): number {
  return cache.size
}
