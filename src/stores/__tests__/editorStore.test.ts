import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from '../editorStore'

describe('editorStore', () => {
  beforeEach(() => {
    useEditorStore.setState({
      sidebarOpen: true,
      showExport: false,
      showImport: false,
      showPanel: false,
      panelTab: 'pdf',
      showTermManager: false,
      showPdfMerge: false,
      showVersionHistory: false,
      showEngineConfig: false,
    })
  })

  it('has correct initial state', () => {
    const state = useEditorStore.getState()
    expect(state.sidebarOpen).toBe(true)
    expect(state.showExport).toBe(false)
    expect(state.showImport).toBe(false)
    expect(state.showPanel).toBe(false)
    expect(state.panelTab).toBe('pdf')
    expect(state.showTermManager).toBe(false)
    expect(state.showPdfMerge).toBe(false)
    expect(state.showVersionHistory).toBe(false)
    expect(state.showEngineConfig).toBe(false)
  })

  it('toggles sidebar', () => {
    const { toggleSidebar } = useEditorStore.getState()
    toggleSidebar()
    expect(useEditorStore.getState().sidebarOpen).toBe(false)
    toggleSidebar()
    expect(useEditorStore.getState().sidebarOpen).toBe(true)
  })

  it('sets showExport', () => {
    const { setShowExport } = useEditorStore.getState()
    setShowExport(true)
    expect(useEditorStore.getState().showExport).toBe(true)
    setShowExport(false)
    expect(useEditorStore.getState().showExport).toBe(false)
  })

  it('sets panelTab', () => {
    const { setPanelTab } = useEditorStore.getState()
    setPanelTab('translate')
    expect(useEditorStore.getState().panelTab).toBe('translate')
  })

  it('toggles panel', () => {
    const { togglePanel } = useEditorStore.getState()
    togglePanel()
    expect(useEditorStore.getState().showPanel).toBe(true)
    expect(useEditorStore.getState().panelTab).toBe('pdf')
    togglePanel()
    expect(useEditorStore.getState().showPanel).toBe(false)
  })

  it('sets showTermManager', () => {
    const { setShowTermManager } = useEditorStore.getState()
    setShowTermManager(true)
    expect(useEditorStore.getState().showTermManager).toBe(true)
  })

  it('sets showPdfMerge', () => {
    const { setShowPdfMerge } = useEditorStore.getState()
    setShowPdfMerge(true)
    expect(useEditorStore.getState().showPdfMerge).toBe(true)
  })

  it('sets showVersionHistory', () => {
    const { setShowVersionHistory } = useEditorStore.getState()
    setShowVersionHistory(true)
    expect(useEditorStore.getState().showVersionHistory).toBe(true)
  })

  it('sets showEngineConfig', () => {
    const { setShowEngineConfig } = useEditorStore.getState()
    setShowEngineConfig(true)
    expect(useEditorStore.getState().showEngineConfig).toBe(true)
  })
})
