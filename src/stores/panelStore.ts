import { create } from 'zustand'
import type { PanelStateEntry } from '../types/editor.types'
import { getPanelState, savePanelState, deletePanelState } from '../utils/storage'

/** Keys for each reference panel tab */
export type PanelStateKey = 'pdf' | 'image' | 'code' | 'docx'

interface PanelStoreState {
  /** In-memory cache of panel states, keyed by tab id */
  states: Record<PanelStateKey, PanelStateEntry | null>
  /** Hydration status per key */
  hydrated: Record<PanelStateKey, boolean>

  /** Load a single panel state from IndexedDB into memory */
  hydrate: (key: PanelStateKey) => Promise<void>
  /** Load all panel states from IndexedDB */
  hydrateAll: () => Promise<void>
  /** Update a panel state (writes to both memory and IndexedDB) */
  setState: (key: PanelStateKey, entry: Omit<PanelStateEntry, 'key' | 'updatedAt'>) => Promise<void>
  /** Clear a panel state (removes from both memory and IndexedDB) */
  clearState: (key: PanelStateKey) => Promise<void>
}

export const usePanelStore = create<PanelStoreState>((set, get) => ({
  states: { pdf: null, image: null, code: null, docx: null },
  hydrated: { pdf: false, image: false, code: false, docx: false },

  hydrate: async (key) => {
    const entry = await getPanelState(key)
    set((s) => ({
      states: { ...s.states, [key]: entry },
      hydrated: { ...s.hydrated, [key]: true },
    }))
  },

  hydrateAll: async () => {
    const keys: PanelStateKey[] = ['pdf', 'image', 'code', 'docx']
    await Promise.all(keys.map((k) => get().hydrate(k)))
  },

  setState: async (key, entry) => {
    const full: PanelStateEntry = { key, ...entry, updatedAt: Date.now() }
    set((s) => ({ states: { ...s.states, [key]: full } }))
    await savePanelState(full)
  },

  clearState: async (key) => {
    set((s) => ({ states: { ...s.states, [key]: null } }))
    await deletePanelState(key)
  },
}))
