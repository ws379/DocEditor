import { create } from 'zustand'
import type { TranslationPair } from '../services/translationMemory'
import { TranslationMemory } from '../services/translationMemory'

const tm = new TranslationMemory()

interface TranslationMemoryState {
  // State
  pairs: TranslationPair[]
  matches: TranslationPair[]
  isSearching: boolean

  // Actions
  loadPairs: () => Promise<void>
  addPair: (source: string, target: string, sourceLang?: string, targetLang?: string) => Promise<void>
  deletePair: (id: string) => Promise<void>
  searchMatches: (query: string, threshold?: number) => Promise<TranslationPair[]>
  setIsSearching: (searching: boolean) => void
  setMatches: (matches: TranslationPair[]) => void
  importFromJson: (jsonStr: string) => Promise<number>
  exportToJson: () => Promise<string>
}

export const useTranslationMemoryStore = create<TranslationMemoryState>((set, get) => ({
  // Initial state
  pairs: [],
  matches: [],
  isSearching: false,

  // Actions
  loadPairs: async () => {
    const pairs = await tm.getAll()
    set({ pairs })
  },

  addPair: async (source, target, sourceLang = 'auto', targetLang = 'auto') => {
    await tm.add(source, target, sourceLang, targetLang)
    await get().loadPairs()
  },

  deletePair: async (id) => {
    await tm.delete(id)
    await get().loadPairs()
  },

  searchMatches: async (query, threshold = 0.7) => {
    set({ isSearching: true })
    try {
      const matches = await tm.findMatches(query, threshold)
      set({ matches })
      return matches
    } finally {
      set({ isSearching: false })
    }
  },

  setIsSearching: (searching) => set({ isSearching: searching }),
  setMatches: (matches) => set({ matches }),

  importFromJson: async (jsonStr) => {
    const count = await tm.importFromJson(jsonStr)
    await get().loadPairs()
    return count
  },

  exportToJson: async () => tm.exportToJson(),
}))
