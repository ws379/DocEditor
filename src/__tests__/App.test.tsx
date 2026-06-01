import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

// Mock DragHandle to avoid tippy.js dependency issues in test environment
vi.mock('@tiptap/extension-drag-handle', () => ({
  default: {
    configure: vi.fn().mockReturnValue({}),
    name: 'dragHandle',
  },
}))

// Mock termStorage to avoid IndexedDB issues in jsdom
vi.mock('../services/termStorage', () => ({
  getAllTerms: vi.fn(async () => []),
  addTerm: vi.fn(async (s: string, t: string) => ({ id: '1', source: s, target: t, createdAt: 0, updatedAt: 0 })),
  updateTerm: vi.fn(async () => {}),
  deleteTerm: vi.fn(async () => {}),
  matchTerms: vi.fn(async () => []),
  importTermsFromJson: vi.fn(async () => 0),
  importTermsFromCsv: vi.fn(async () => 0),
  exportTermsToJson: vi.fn(async () => '[]'),
  exportTermsToCsv: vi.fn(async () => ''),
}))

// Mock translationMemory service
vi.mock('../services/translationMemory', () => ({
  getAllTranslationMemories: vi.fn(async () => []),
  addTranslationMemory: vi.fn(async () => ({})),
  findSimilarTranslation: vi.fn(async () => null),
  deleteTranslationMemory: vi.fn(async () => {}),
}))

// Mock db module to avoid IndexedDB issues in jsdom
vi.mock('../utils/db', () => {
  const stores: Record<string, any[]> = {}
  const mockTable = (name: string) => ({
    toArray: vi.fn(async () => stores[name] || []),
    add: vi.fn(async (item: any) => { (stores[name] ||= []).push(item); return item.id }),
    put: vi.fn(async (item: any) => item),
    get: vi.fn(async () => null),
    delete: vi.fn(async () => {}),
    clear: vi.fn(async () => { stores[name] = [] }),
    bulkAdd: vi.fn(async (items: any[]) => { (stores[name] ||= []).push(...items) }),
    where: vi.fn(() => ({ toArray: vi.fn(async () => []) })),
    orderBy: vi.fn(() => ({ toArray: vi.fn(async () => stores[name] || []), reverse: vi.fn(() => ({ toArray: vi.fn(async () => stores[name] || []) })) })),
  })
  return {
    db: {
      drafts: mockTable('drafts'),
      versions: mockTable('versions'),
      terms: mockTable('terms'),
      translationMemory: mockTable('translationMemory'),
      bilingualSegments: mockTable('bilingualSegments'),
      panelState: mockTable('panelState'),
    },
  }
})

// Mock all lazy-loaded components
vi.mock('../components/ExportModal/ExportModal', () => ({ ExportModal: () => <div>ExportModal</div> }))
vi.mock('../components/ImportModal/ImportModal', () => ({ ImportModal: () => <div>ImportModal</div> }))
vi.mock('../components/ReferencePanel/PdfViewer', () => ({ PdfViewer: () => <div>PdfViewer</div> }))
vi.mock('../components/ReferencePanel/ImageViewer', () => ({ ImageViewer: () => <div>ImageViewer</div> }))
vi.mock('../components/ReferencePanel/CodeViewer', () => ({ CodeViewer: () => <div>CodeViewer</div> }))
vi.mock('../components/ReferencePanel/DocxViewer', () => ({ DocxViewer: () => <div>DocxViewer</div> }))
vi.mock('../components/ReferencePanel/TranslateResult', () => ({ TranslateResult: () => <div>TranslateResult</div> }))
vi.mock('../components/TranslatePopup/TranslatePopup', () => ({ TranslatePopup: () => <div>TranslatePopup</div> }))
vi.mock('../components/TermManager/TermManager', () => ({ TermManager: () => <div>TermManager</div> }))
vi.mock('../components/PdfMerge/PdfMergeModal', () => ({ PdfMergeModal: () => <div>PdfMergeModal</div> }))
vi.mock('../components/VersionHistory/VersionHistory', () => ({ VersionHistory: () => <div>VersionHistory</div> }))
vi.mock('../components/SettingsModal/EngineConfig', () => ({ EngineConfig: () => <div>EngineConfig</div> }))
vi.mock('../components/Editor/TermTooltip', () => ({ TermTooltip: () => <div>TermTooltip</div> }))
vi.mock('../components/BilingualView/BilingualView', () => ({ BilingualView: () => <div>BilingualView</div> }))
vi.mock('../components/SearchReplace/SearchBar', () => ({ SearchBar: () => <div>SearchBar</div> }))
vi.mock('../components/ShortcutPanel/ShortcutPanel', () => ({ ShortcutPanel: () => <div>ShortcutPanel</div> }))

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    // Should render the header
    expect(screen.getByText('DocEditor')).toBeDefined()
  })

  it('renders the ribbon tabs', () => {
    render(<App />)
    expect(screen.getByText('开始')).toBeDefined()
    expect(screen.getByText('插入')).toBeDefined()
    expect(screen.getByText('布局')).toBeDefined()
  })

  it('renders the editor area', () => {
    render(<App />)
    // The editor container should exist
    const editor = document.querySelector('.ProseMirror')
    expect(editor).toBeDefined()
  })
})
