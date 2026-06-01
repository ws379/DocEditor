import { useEditorInstance } from '../Editor/EditorInstanceContext'
import { useState, useEffect, useCallback, useRef } from 'react'

interface SearchBarProps {
  mode: 'search' | 'replace'
  onClose: () => void
}

export function SearchBar({ mode, onClose }: SearchBarProps) {
  const { editor } = useEditorInstance()
  const [query, setQuery] = useState('')
  const [replace, setReplace] = useState('')
  const [showReplace, setShowReplace] = useState(mode === 'replace')
  const [resultCount, setResultCount] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // 实时搜索
  useEffect(() => {
    if (!editor) return
    ;(editor.commands as any).setSearchQuery(query)
    const storage = (editor.storage as any).searchReplace
    if (storage) {
      setResultCount(storage.results.length)
      setCurrentIndex(storage.activeResult)
    }
  }, [editor, query])

  // Update replace query
  useEffect(() => {
    if (!editor) return
    ;(editor.commands as any).setReplaceQuery(replace)
  }, [editor, replace])

  const handleFindNext = useCallback(() => {
    ;(editor?.commands as any).findNext()
    const storage = (editor?.storage as any)?.searchReplace
    if (storage) setCurrentIndex(storage.activeResult)
  }, [editor])

  const handleFindPrev = useCallback(() => {
    ;(editor?.commands as any).findPrev()
    const storage = (editor?.storage as any)?.searchReplace
    if (storage) setCurrentIndex(storage.activeResult)
  }, [editor])

  const handleReplace = useCallback(() => {
    ;(editor?.commands as any).replaceCurrent()
    const storage = (editor?.storage as any)?.searchReplace
    if (storage) {
      setResultCount(storage.results.length)
      setCurrentIndex(storage.activeResult)
    }
  }, [editor])

  const handleReplaceAll = useCallback(() => {
    ;(editor?.commands as any).replaceAll()
    const storage = (editor?.storage as any)?.searchReplace
    if (storage) {
      setResultCount(storage.results.length)
      setCurrentIndex(-1)
    }
  }, [editor])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        handleFindPrev()
      } else {
        handleFindNext()
      }
    }
  }

  return (
    <div
      className="fixed top-14 right-4 z-50 bg-white rounded-lg shadow-xl border border-slate-200 p-3 w-[340px]"
      onKeyDown={handleKeyDown}
    >
      {/* Search input row */}
      <div className="flex items-center gap-2 mb-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="查找..."
          className="flex-1 text-sm border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
        />
        <span className="text-xs text-slate-400 min-w-[50px] text-center">
          {resultCount > 0 ? `${currentIndex + 1}/${resultCount}` : query ? '无结果' : ''}
        </span>
        <button onClick={handleFindPrev} className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded" title="上一个 (Shift+Enter)">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
        </button>
        <button onClick={handleFindNext} className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded" title="下一个 (Enter)">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600" title="关闭 (Esc)">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Toggle replace mode */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setShowReplace(!showReplace)}
          className="text-xs text-slate-500 hover:text-slate-700"
          title={showReplace ? '隐藏替换' : '显示替换'}
        >
          <svg className={`w-4 h-4 transition-transform ${showReplace ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <span className="text-xs text-slate-500">替换</span>
      </div>

      {/* Replace input row */}
      {showReplace && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={replace}
            onChange={e => setReplace(e.target.value)}
            placeholder="替换为..."
            className="flex-1 text-sm border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
          />
          <button onClick={handleReplace} className="px-2 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded" title="替换当前">
            替换
          </button>
          <button onClick={handleReplaceAll} className="px-2 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded" title="全部替换">
            全部
          </button>
        </div>
      )}
    </div>
  )
}
