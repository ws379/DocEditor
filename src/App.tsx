import React, { Suspense, useEffect, useCallback, useRef, useState } from 'react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CharacterCount from '@tiptap/extension-character-count'
import FontFamily from '@tiptap/extension-font-family'
import { LineHeight } from './components/Editor/extensions/LineHeight'
import Typography from '@tiptap/extension-typography'
import { FontSize } from './components/Editor/extensions/FontSize'
import { SlashCommand } from './components/Editor/extensions/SlashCommand'
import { TermHighlight } from './components/Editor/extensions/TermHighlight'
import { useTermStore } from './stores/termStore'
import type { Term } from './services/termStorage'
import { FileEmbed } from './components/Editor/extensions/FileEmbed'
import { SearchReplace } from './components/Editor/extensions/SearchReplace'
import { Indent } from './components/Editor/extensions/Indent'
import { PageBreak } from './components/Editor/extensions/PageBreak'
import { DragHandleComponent } from './components/Editor/DragHandleComponent'

import { EditorInstanceContext } from './components/Editor/EditorInstanceContext'
import { TiptapEditor } from './components/Editor/TiptapEditor'
import { RibbonTabs } from './components/Ribbon/RibbonTabs'
import { DraftSidebar } from './components/DraftSidebar/DraftSidebar'
import { PanelContainer } from './components/ReferencePanel/PanelContainer'
import { AppHeader } from './components/AppHeader'
import { useSelection } from './hooks/useSelection'
import { refineToWordBoundary, smartTrimSelection } from './utils/selectionHelper'
import { useAutoSave } from './hooks/useAutoSave'
import { useEditorStore } from './stores/editorStore'
import { useDraftStore } from './stores/draftStore'
import { useTranslationStore } from './stores/translationStore'
import { useBilingualStore } from './stores/bilingualStore'
import { usePanelStore } from './stores/panelStore'
import { useFocusMode } from './hooks/useFocusMode'
import { toast } from './stores/toastStore'
import { ToastContainer } from './components/Toast/ToastContainer'

// Lazy load heavy modal components for code splitting
const ExportModal = React.lazy(() => import('./components/ExportModal/ExportModal').then(m => ({ default: m.ExportModal })))
const ImportModal = React.lazy(() => import('./components/ImportModal/ImportModal').then(m => ({ default: m.ImportModal })))
const PdfViewer = React.lazy(() => import('./components/ReferencePanel/PdfViewer').then(m => ({ default: m.PdfViewer })))
const ImageViewer = React.lazy(() => import('./components/ReferencePanel/ImageViewer').then(m => ({ default: m.ImageViewer })))
const CodeViewer = React.lazy(() => import('./components/ReferencePanel/CodeViewer').then(m => ({ default: m.CodeViewer })))
const DocxViewer = React.lazy(() => import('./components/ReferencePanel/DocxViewer').then(m => ({ default: m.DocxViewer })))
const TranslateResult = React.lazy(() => import('./components/ReferencePanel/TranslateResult').then(m => ({ default: m.TranslateResult })))
const TranslatePopup = React.lazy(() => import('./components/TranslatePopup/TranslatePopup').then(m => ({ default: m.TranslatePopup })))
const TermManager = React.lazy(() => import('./components/TermManager/TermManager').then(m => ({ default: m.TermManager })))
const PdfMergeModal = React.lazy(() => import('./components/PdfMerge/PdfMergeModal').then(m => ({ default: m.PdfMergeModal })))
const VersionHistory = React.lazy(() => import('./components/VersionHistory/VersionHistory').then(m => ({ default: m.VersionHistory })))
const EngineConfig = React.lazy(() => import('./components/SettingsModal/EngineConfig').then(m => ({ default: m.EngineConfig })))
const TermTooltip = React.lazy(() => import('./components/Editor/TermTooltip').then(m => ({ default: m.TermTooltip })))
const BilingualView = React.lazy(() => import('./components/BilingualView/BilingualView').then(m => ({ default: m.BilingualView })))
const SearchBar = React.lazy(() => import('./components/SearchReplace/SearchBar').then(m => ({ default: m.SearchBar })))
const ShortcutPanel = React.lazy(() => import('./components/ShortcutPanel/ShortcutPanel').then(m => ({ default: m.ShortcutPanel })))

const SAVE_CONFIRM_DURATION_MS = 2000

export default function App() {
  // Editor UI state from store
  const {
    sidebarOpen,
    showExport,
    showImport,
    showPanel,
    panelTab,
    showTermManager,
    showPdfMerge,
    showVersionHistory,
    showEngineConfig,
    setShowExport,
    setShowImport,
    setPanelTab,
    setShowTermManager,
    setShowPdfMerge,
    setShowVersionHistory,
    setShowEngineConfig,
    togglePanel,
  } = useEditorStore()

  // Translation state from store
  const {
    translateEnabled,
    translateSelection,
    setTranslateSelection,
    clearTranslateSelection,
  } = useTranslationStore()

  // Focus mode & shortcuts panel
  const { enabled: focusModeEnabled, toggle: toggleFocusMode } = useFocusMode()
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Term tooltip state
  const [hoveredTerm, setHoveredTerm] = useState<{ term: Term; rect: DOMRect } | null>(null)

  // Bilingual segments from store
  const {
    segments: bilingualSegments,
    loadSegments: loadBilingualSegments,
    addOrUpdateSegment,
    updateSegment,
    deleteSegment,
    saveSegments: saveBilingualSegments,
    clearSegments: clearBilingualSegments,
    exportCSV: exportBilingualSegments,
  } = useBilingualStore()

  // Load bilingual segments on mount
  useEffect(() => {
    loadBilingualSegments()
  }, [loadBilingualSegments])

  // Draft state from store
  const {
    drafts,
    current,
    setCurrent,
    loadDraft,
    handleNew,
    handleDelete,
    handleRename,
    handleSaveVersion,
    loadAllDrafts,
    saveCurrentDraft,
  } = useDraftStore()

  // Term store for highlighting
  const { terms, loadTerms } = useTermStore()

  const editorContainerRef = useRef<HTMLDivElement>(null)
  const panelContainerRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }), Underline, TextStyle, FontFamily, Color, Subscript, Superscript, Typography, FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: '开始编辑您的文档...' }),
      Table.configure({ resizable: true }), TableRow, TableCell, TableHeader,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer' } }),
      TaskList, TaskItem.configure({ nested: true }),
      CharacterCount,
      LineHeight,
      SlashCommand,
      TermHighlight.configure({ terms }),
      FileEmbed,
      SearchReplace,
      Indent,
      PageBreak,
    ],
    content: '',
    editorProps: { attributes: { class: 'focus:outline-none' } },
  })

  // Force editor to re-render decorations when terms change (for highlighting)
  useEffect(() => {
    if (editor && terms.length > 0) {
      editor.view.dispatch(editor.view.state.tr)
    }
  }, [editor, terms])

  const getContent = useCallback(() => editor?.getHTML() || '', [editor])
  const { markDirty, saveNow } = useAutoSave(getContent)
  const [saved, setSaved] = useState(false)

  // Search & Replace state
  const [searchBarMode, setSearchBarMode] = useState<'search' | 'replace' | null>(null)

  // Ctrl+F / Ctrl+H keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setSearchBarMode('search')
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault()
        setSearchBarMode('replace')
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Load drafts, terms, and panel state on mount
  const hydratePanelAll = usePanelStore((s) => s.hydrateAll)
  useEffect(() => {
    loadAllDrafts()
    loadTerms()
    hydratePanelAll()
  }, [loadAllDrafts, loadTerms, hydratePanelAll])

  // Sync editor content when switching to a different draft (not on every update)
  const lastSyncedIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (editor && current && current.id !== lastSyncedIdRef.current) {
      lastSyncedIdRef.current = current.id
      editor.commands.setContent(current.content || '')
    }
  }, [editor, current])

  // Handle term hover for tooltip
  useEffect(() => {
    const container = editorContainerRef.current
    if (!container) return

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('term-highlight')) {
        const rect = target.getBoundingClientRect()
        const id = target.getAttribute('data-term-id')
        const source = target.getAttribute('data-term-source')
        const termTarget = target.getAttribute('data-term-target')
        if (id && source && termTarget) {
          const term: Term = { id, source, target: termTarget, createdAt: 0, updatedAt: 0 }
          setHoveredTerm({ term, rect })
        }
      }
    }

    const handleMouseOut = (_e: MouseEvent) => {
      // Don't close on mouseout — let the tooltip's click-outside handler manage closing.
      // This prevents the tooltip from disappearing when the user moves the mouse down to it.
    }

    container.addEventListener('mouseover', handleMouseOver)
    container.addEventListener('mouseout', handleMouseOut)
    return () => {
      container.removeEventListener('mouseover', handleMouseOver)
      container.removeEventListener('mouseout', handleMouseOut)
    }
  }, [])

  // Selection handlers — ✅ 先精确化到词边界，再智能收缩到句子边界
  const handleTranslateSelection = useCallback((text: string, rect: DOMRect) => {
    let refinedText = refineToWordBoundary(text)
    refinedText = smartTrimSelection(refinedText, 5000)
    if (!refinedText) return
    setTranslateSelection({ text: refinedText, rect })
  }, [setTranslateSelection])

  useSelection({
    containerRef: editorContainerRef,
    enabled: translateEnabled,
    onSelect: handleTranslateSelection,
    maxLength: 5000,
  })

  useSelection({
    containerRef: panelContainerRef,
    enabled: translateEnabled && panelTab !== 'pdf',
    onSelect: handleTranslateSelection,
    ready: showPanel,
    maxLength: 5000,
  })

  const handleImport = async (result: { html: string; title: string }) => {
    if (editor) {
      editor.commands.setContent(result.html)
      if (current) {
        await saveCurrentDraft(result.html)
        setCurrent({ ...current, title: result.title })
      } else {
        const d = await handleNew()
        if (d) {
          await saveCurrentDraft(result.html)
          setCurrent({ ...d, title: result.title })
        }
      }
    }
    setShowImport(false)
  }

  return (
    <EditorInstanceContext.Provider value={{ editor }}>
      <div className="h-screen flex flex-col bg-gray-50">
        <AppHeader
          title={current?.title}
          version={current?.version}
          saved={saved}
          translateEnabled={translateEnabled}
          focusModeEnabled={focusModeEnabled}
          showPanel={showPanel}
          onToggleSidebar={() => useEditorStore.getState().toggleSidebar()}
          onSave={async () => {
            try {
              await saveNow()
              setSaved(true)
              setTimeout(() => setSaved(false), SAVE_CONFIRM_DURATION_MS)
            } catch (e) {
              console.error('Manual save failed:', e)
              toast.error('保存失败，请重试')
            }
          }}
          onImport={() => setShowImport(true)}
          onSnapshot={() => handleSaveVersion(getContent)}
          onExport={() => setShowExport(true)}
          onTogglePanel={togglePanel}
          onTermManager={() => setShowTermManager(true)}
          onPdfMerge={() => setShowPdfMerge(true)}
          onVersionHistory={() => setShowVersionHistory(true)}
          onToggleTranslate={() => useTranslationStore.getState().toggleTranslate()}
          onEngineConfig={() => setShowEngineConfig(true)}
          onToggleFocusMode={toggleFocusMode}
          onShortcuts={() => setShowShortcuts(true)}
        />
        <div className="no-print"><RibbonTabs /></div>
        <div className="flex-1 flex overflow-hidden">
          {sidebarOpen && <div className="no-print"><DraftSidebar /></div>}
          <div className="flex-1 overflow-auto bg-gray-100" ref={editorContainerRef}>
            <div className="max-w-[800px] mx-auto my-6 bg-white shadow-sm rounded-lg border border-gray-200 min-h-[calc(100vh-180px)]">
              <TiptapEditor onUpdate={() => markDirty()} />
              <DragHandleComponent />
            </div>
          </div>
          {showPanel && (
            <div className="no-print" ref={panelContainerRef}>
              <PanelContainer>
                <Suspense fallback={<div className="flex items-center justify-center h-full">加载中...</div>}>
                  {/* All viewers stay mounted; inactive ones hidden via display:none to preserve state (PDF, image, code, docx uploads persist across tab switches) */}
                  <div style={{ display: panelTab === 'pdf' ? 'contents' : 'none' }}><PdfViewer /></div>
                  <div style={{ display: panelTab === 'image' ? 'contents' : 'none' }}><ImageViewer /></div>
                  <div style={{ display: panelTab === 'code' ? 'contents' : 'none' }}><CodeViewer /></div>
                  <div style={{ display: panelTab === 'docx' ? 'contents' : 'none' }}><DocxViewer /></div>
                  <div style={{ display: panelTab === 'translate' ? 'contents' : 'none' }}><TranslateResult text={translateSelection?.text} /></div>
                  <div style={{ display: panelTab === 'bilingual' ? 'contents' : 'none' }}>
                    <BilingualView
                      segments={bilingualSegments}
                      onSegmentChange={updateSegment}
                      onSegmentDelete={deleteSegment}
                      onSave={saveBilingualSegments}
                      onClear={() => {
                        if (window.confirm('确定清空所有句对？')) clearBilingualSegments()
                      }}
                      onExport={exportBilingualSegments}
                    />
                  </div>
                </Suspense>
              </PanelContainer>
            </div>
          )}
        </div>
        <Suspense fallback={<div className="fixed inset-0 bg-black/20 flex items-center justify-center"><div className="bg-white p-4 rounded-lg shadow-lg">加载中...</div></div>}>
          {showExport && <ExportModal />}
          {showImport && <ImportModal onImport={handleImport} />}
          {showTermManager && <TermManager />}
          {showPdfMerge && <PdfMergeModal />}
          {showVersionHistory && current && (
            <VersionHistory
              draftId={current.id}
              currentContent={getContent()}
              onRestore={(content) => {
                editor?.commands.setContent(content)
                saveCurrentDraft(content)
              }}
            />
          )}
          {showEngineConfig && <EngineConfig />}
          {searchBarMode && (
            <SearchBar
              mode={searchBarMode}
              onClose={() => setSearchBarMode(null)}
            />
          )}
          {showShortcuts && (
            <ShortcutPanel onClose={() => setShowShortcuts(false)} />
          )}
          {translateSelection && (
            <TranslatePopup
              text={translateSelection.text}
              rect={translateSelection.rect}
              onClose={() => {
                clearTranslateSelection()
                window.getSelection()?.removeAllRanges()
              }}
              onSaveTerm={(source, target) => {
                setShowTermManager(true)
              }}
              onTranslateComplete={(source, target) => {
                addOrUpdateSegment(source, target)
              }}
            />
          )}
          {hoveredTerm && (
            <TermTooltip
              term={hoveredTerm.term}
              rect={hoveredTerm.rect}
              onClose={() => setHoveredTerm(null)}
              onReplace={(newText) => {
                // Replace the term in editor
                if (editor) {
                  const { state } = editor
                  const { doc } = state
                  let tr = state.tr
                  doc.descendants((node, pos) => {
                    if (node.isText && node.text?.includes(hoveredTerm.term.source)) {
                      const index = node.text.indexOf(hoveredTerm.term.source)
                      if (index >= 0) {
                        tr = tr.insertText(newText, pos + index, pos + index + hoveredTerm.term.source.length)
                      }
                    }
                  })
                  editor.view.dispatch(tr)
                }
                setHoveredTerm(null)
              }}
            />
          )}
        </Suspense>
        {/* 专注模式浮动退出按钮 */}
        {focusModeEnabled && (
          <button
            onClick={toggleFocusMode}
            className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-purple-600 text-white text-sm rounded-full shadow-lg hover:bg-purple-700 transition-opacity opacity-70 hover:opacity-100"
            title="退出专注模式 (ESC)"
          >
            ✕ 退出专注
          </button>
        )}
        <ToastContainer />
      </div>
    </EditorInstanceContext.Provider>
  )
}
