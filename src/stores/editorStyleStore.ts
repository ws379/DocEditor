import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface EditorStyleState {
  fontSize: number
  lineHeight: number
  fontFamily: string
  theme: Theme
  setFontSize: (size: number) => void
  setLineHeight: (height: number) => void
  setFontFamily: (family: string) => void
  toggleTheme: () => void
  getCssVariables: () => Record<string, string>
}

export const useEditorStyleStore = create<EditorStyleState>((set, get) => ({
  fontSize: 14,
  lineHeight: 1.8,
  fontFamily: 'Microsoft YaHei',
  theme: 'light',

  setFontSize: (size) => set({ fontSize: size }),
  setLineHeight: (height) => set({ lineHeight: height }),
  setFontFamily: (family) => set({ fontFamily: family }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

  getCssVariables: () => {
    const { fontSize, lineHeight, fontFamily } = get()
    return {
      '--editor-font-size': `${fontSize}px`,
      '--editor-line-height': String(lineHeight),
      '--editor-font-family': fontFamily,
    }
  },
}))
