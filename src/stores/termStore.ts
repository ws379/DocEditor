import { create } from 'zustand'
import type { Term } from '../services/termStorage'
import { notifyDBChanged } from '../hooks/useLiveDrafts'
import {
  getAllTerms,
  addTerm as addTermInDB,
  updateTerm as updateTermInDB,
  deleteTerm as deleteTermInDB,
  matchTerms as matchTermsInDB,
  importTermsFromJson,
  importTermsFromCsv,
  exportTermsToJson,
  exportTermsToCsv,
} from '../services/termStorage'

interface TermState {
  // State
  terms: Term[]
  matchedTerms: Term[]

  // Actions
  loadTerms: () => Promise<void>
  handleAddTerm: (source: string, target: string) => Promise<void>
  handleUpdateTerm: (id: string, source: string, target: string) => Promise<void>
  handleDeleteTerm: (id: string) => Promise<void>
  matchTerms: (text: string) => Promise<void>
  importFromJson: (jsonStr: string) => Promise<number>
  importFromCsv: (csvStr: string) => Promise<number>
  exportToJson: () => Promise<string>
  exportToCsv: () => Promise<string>
}

export const useTermStore = create<TermState>((set, get) => ({
  // Initial state
  terms: [],
  matchedTerms: [],

  // Actions
  loadTerms: async () => {
    const terms = await getAllTerms()
    set({ terms })
  },

  handleAddTerm: async (source, target) => {
    const term = await addTermInDB(source, target)
    set((state) => ({ terms: [...state.terms, term] }))
    notifyDBChanged()
  },

  handleUpdateTerm: async (id, source, target) => {
    await updateTermInDB(id, source, target)
    set((state) => ({
      terms: state.terms.map((t) =>
        t.id === id ? { ...t, source, target, updatedAt: Date.now() } : t
      ),
    }))
    notifyDBChanged()
  },

  handleDeleteTerm: async (id) => {
    await deleteTermInDB(id)
    set((state) => ({ terms: state.terms.filter((t) => t.id !== id) }))
    notifyDBChanged()
  },

  matchTerms: async (text) => {
    const matched = await matchTermsInDB(text)
    set({ matchedTerms: matched })
  },

  importFromJson: async (jsonStr) => {
    const count = await importTermsFromJson(jsonStr)
    await get().loadTerms()
    notifyDBChanged()
    return count
  },

  importFromCsv: async (csvStr) => {
    const count = await importTermsFromCsv(csvStr)
    await get().loadTerms()
    notifyDBChanged()
    return count
  },

  exportToJson: async () => exportTermsToJson(),
  exportToCsv: async () => exportTermsToCsv(),
}))
