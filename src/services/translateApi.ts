import { API_CONFIG } from '../config/api'
import { getCached, setCached } from './translationCache'

const API_BASE = API_CONFIG.baseUrl

const MAX_RETRIES = 3
const BASE_DELAY_MS = 500

export interface TranslateRequest {
  text: string
  sourceLang?: string
  targetLang?: string
  engine?: string
}

export interface TranslateResponse {
  success: boolean
  translatedText?: string
  engine?: string
  sourceLang?: string
  targetLang?: string
  error?: string
}

export interface Engine {
  name: string
  label: string
  available: boolean
}

/**
 * Translate text using the backend API.
 * Features: in-memory LRU cache + exponential backoff retry (3 attempts).
 */
export async function translateText(request: TranslateRequest): Promise<TranslateResponse> {
  const sourceLang = request.sourceLang || 'auto'
  const targetLang = request.targetLang || 'zh'
  const engine = request.engine || 'default'

  // Check cache first
  const cached = getCached(request.text, sourceLang, targetLang, engine)
  if (cached !== null) {
    return { success: true, translatedText: cached, engine, sourceLang, targetLang }
  }

  let lastError = ''
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${API_BASE}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: request.text, sourceLang, targetLang, engine }),
      })

      const data = await response.json()

      if (!response.ok) {
        lastError = data.error || 'Translation failed'
        if (response.status >= 400 && response.status < 500) {
          return { success: false, error: lastError }
        }
        if (attempt < MAX_RETRIES - 1) {
          await delay(BASE_DELAY_MS * Math.pow(2, attempt))
          continue
        }
        return { success: false, error: lastError }
      }

      const translatedText = data.translatedText as string
      if (translatedText) {
        setCached(request.text, sourceLang, targetLang, engine, translatedText)
      }
      return {
        success: true,
        translatedText,
        engine: data.engine,
        sourceLang: data.sourceLang,
        targetLang: data.targetLang,
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Network error'
      if (attempt < MAX_RETRIES - 1) {
        await delay(BASE_DELAY_MS * Math.pow(2, attempt))
        continue
      }
    }
  }

  return { success: false, error: lastError }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Get available translation engines
 */
export async function getEngines(): Promise<Engine[]> {
  try {
    const response = await fetch(`${API_BASE}/config/engines`)
    const data = await response.json()
    return data.engines || []
  } catch (error) {
    console.error('Failed to fetch engines:', error)
    return []
  }
}

/**
 * Update engine configuration
 */
export async function updateEngineConfig(engineName: string, config: Record<string, string>): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/config/engines/${engineName}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    })
    const data = await response.json()
    return data.success || false
  } catch (error) {
    console.error('Failed to update engine config:', error)
    return false
  }
}

/**
 * Check if an engine is available
 */
export async function checkEngine(engineName: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/config/engines/${engineName}/check`)
    const data = await response.json()
    return data.available || false
  } catch (error) {
    console.error('Failed to check engine:', error)
    return false
  }
}

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`)
    const data = await response.json()
    return data.status === 'ok'
  } catch (error) {
    return false
  }
}
