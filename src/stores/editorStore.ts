import { create } from 'zustand'

export type PanelTab = 'pdf' | 'image' | 'code' | 'docx' | 'translate' | 'bilingual'

interface EditorState {
  // UI state
  sidebarOpen: boolean
  showExport: boolean
  showImport: boolean
  showPanel: boolean
  panelTab: PanelTab
  showTermManager: boolean
  showPdfMerge: boolean
  showVersionHistory: boolean
  showEngineConfig: boolean

  // Actions
  toggleSidebar: () => void
  setShowExport: (show: boolean) => void
  setShowImport: (show: boolean) => void
  setShowPanel: (show: boolean) => void
  togglePanel: () => void
  setPanelTab: (tab: PanelTab) => void
  setShowTermManager: (show: boolean) => void
  setShowPdfMerge: (show: boolean) => void
  setShowVersionHistory: (show: boolean) => void
  setShowEngineConfig: (show: boolean) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  // Initial state
  sidebarOpen: true,
  showExport: false,
  showImport: false,
  showPanel: false,
  panelTab: 'pdf',
  showTermManager: false,
  showPdfMerge: false,
  showVersionHistory: false,
  showEngineConfig: false,

  // Actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setShowExport: (show) => set({ showExport: show }),
  setShowImport: (show) => set({ showImport: show }),
  setShowPanel: (show) => set({ showPanel: show }),
  togglePanel: () => set((state) => ({ showPanel: !state.showPanel, panelTab: 'pdf' })),
  setPanelTab: (tab) => set({ panelTab: tab }),
  setShowTermManager: (show) => set({ showTermManager: show }),
  setShowPdfMerge: (show) => set({ showPdfMerge: show }),
  setShowVersionHistory: (show) => set({ showVersionHistory: show }),
  setShowEngineConfig: (show) => set({ showEngineConfig: show }),
}))
