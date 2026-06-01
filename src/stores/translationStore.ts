import { create } from 'zustand'

interface TranslateSelection {
  text: string
  rect: DOMRect
}

interface TranslationState {
  // State
  translateEnabled: boolean
  translateSelection: TranslateSelection | null

  // Actions
  toggleTranslate: () => void
  setTranslateSelection: (selection: TranslateSelection) => void
  clearTranslateSelection: () => void
}

export const useTranslationStore = create<TranslationState>((set) => ({
  // Initial state — read from localStorage
  translateEnabled: localStorage.getItem('doceditor_translate_enabled') !== 'false',
  translateSelection: null,

  // Actions
  toggleTranslate: () =>
    set((state) => {
      const next = !state.translateEnabled
      localStorage.setItem('doceditor_translate_enabled', String(next))
      return { translateEnabled: next }
    }),

  setTranslateSelection: (selection) =>
    set(() => {
      if (selection.text.length === 0) return { translateSelection: null }
      return { translateSelection: selection }
    }),

  clearTranslateSelection: () => set({ translateSelection: null }),
}))
