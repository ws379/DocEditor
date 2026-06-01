import { openDB, type IDBPDatabase } from 'idb'
import { similarity } from '../utils/fuzzyMatch'
import { generateId } from '../utils/id'

export interface TranslationPair {
  id: string
  source: string
  target: string
  sourceLang: string
  targetLang: string
  usageCount: number
  createdAt: number
  updatedAt: number
}

interface TMDB {
  pairs: {
    key: string
    value: TranslationPair
    indexes: {
      'by-source': string
      'by-usage': number
    }
  }
}

const DB_NAME = 'DocEditorTM'
const DB_VERSION = 1

export class TranslationMemory {
  private dbPromise: Promise<IDBPDatabase<TMDB>> | null = null

  private getDB(): Promise<IDBPDatabase<TMDB>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<TMDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          const store = db.createObjectStore('pairs', { keyPath: 'id' })
          store.createIndex('by-source', 'source')
          store.createIndex('by-usage', 'usageCount')
        },
      })
    }
    return this.dbPromise
  }

  async add(source: string, target: string, sourceLang: string, targetLang: string): Promise<TranslationPair> {
    const db = await this.getDB()
    const now = Date.now()
    const pair: TranslationPair = {
      id: generateId('tm'),
      source,
      target,
      sourceLang,
      targetLang,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    }
    await db.put('pairs', pair)
    return pair
  }

  async getAll(): Promise<TranslationPair[]> {
    const db = await this.getDB()
    return db.getAll('pairs')
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDB()
    await db.delete('pairs', id)
  }

  async findMatches(query: string, threshold = 0.7): Promise<TranslationPair[]> {
    const db = await this.getDB()
    const allPairs = await db.getAll('pairs')

    const matches: Array<{ pair: TranslationPair; score: number }> = []

    for (const pair of allPairs) {
      // Exact match
      if (pair.source === query) {
        matches.push({ pair, score: 1 })
        continue
      }

      // Fuzzy match
      const sim = similarity(pair.source, query)
      if (sim >= threshold) {
        matches.push({ pair, score: sim })
      }
    }

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score)

    // Update usage count for matched pairs (immutable update)
    const now = Date.now()
    for (const { pair } of matches) {
      const updated = { ...pair, usageCount: pair.usageCount + 1, updatedAt: now }
      await db.put('pairs', updated)
    }

    return matches.map((m) => m.pair)
  }

  async importFromJson(jsonStr: string): Promise<number> {
    const items = JSON.parse(jsonStr) as Array<{ source: string; target: string }>
    let count = 0
    for (const item of items) {
      if (item.source && item.target) {
        await this.add(item.source, item.target, 'auto', 'auto')
        count++
      }
    }
    return count
  }

  async exportToJson(): Promise<string> {
    const pairs = await this.getAll()
    return JSON.stringify(
      pairs.map(({ source, target }) => ({ source, target })),
      null,
      2
    )
  }
}
