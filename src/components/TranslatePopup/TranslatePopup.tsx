import React, { useState, useEffect, useRef } from 'react'
import { translateText } from '../../services/translateApi'
import { addTerm } from '../../services/termStorage'
import { useTranslationMemoryStore } from '../../stores/translationMemoryStore'
import { smartTrimSelection } from '../../utils/selectionHelper'
import { toast } from '../../stores/toastStore'

interface TranslatePopupProps {
  text: string
  rect: DOMRect
  onClose: () => void
  onSaveTerm?: (source: string, target: string) => void
  onTranslateComplete?: (source: string, target: string) => void
}

const LANGUAGES = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: '英文' },
  { code: 'ja', label: '日语' },
  { code: 'ko', label: '韩语' },
  { code: 'fr', label: '法语' },
  { code: 'de', label: '德语' },
  { code: 'es', label: '西班牙语' },
  { code: 'ru', label: '俄语' },
]

export const TranslatePopup: React.FC<TranslatePopupProps> = ({
  text,
  rect,
  onClose,
  onTranslateComplete,
}) => {
  const { searchMatches } = useTranslationMemoryStore()
  const [translatedText, setTranslatedText] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editedTarget, setEditedTarget] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  // ✅ 可编辑的源文本，用户可以手动修正选区
  const [editableSource, setEditableSource] = useState(text)
  const [sourceLang, setSourceLang] = useState(() => localStorage.getItem('doceditor_translate_source') || 'auto')
  const [targetLang, setTargetLang] = useState(() => localStorage.getItem('doceditor_translate_target') || 'zh')
  const [saved, setSaved] = useState(false)
  const [tmMatch, setTmMatch] = useState<string | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const POPUP_WIDTH = 320
  const POPUP_HEIGHT = 280
  const POPUP_PADDING = 8
  const POPUP_MARGIN = 10

  const getPopupStyle = (): React.CSSProperties => {
    let top = rect.top - POPUP_HEIGHT - POPUP_PADDING
    let left = rect.left
    if (top < 0) top = rect.bottom + POPUP_PADDING
    if (left + POPUP_WIDTH > window.innerWidth) left = window.innerWidth - POPUP_WIDTH - POPUP_MARGIN
    if (left < POPUP_MARGIN) left = POPUP_MARGIN
    if (left < 10) left = 10
    return { position: 'fixed', top: `${top}px`, left: `${left}px`, zIndex: 1000 }
  }

  const doTranslate = async () => {
    const textToTranslate = editableSource.trim()
    if (!textToTranslate) return

    setIsLoading(true)
    setError(null)
    setTmMatch(null)

    // Search Translation Memory first — use returned results to avoid stale state
    const tmResults = await searchMatches(textToTranslate, 0.8)
    const tmResult = tmResults.find(m => m.source === textToTranslate || m.source.toLowerCase() === textToTranslate.toLowerCase())
    if (tmResult) {
      setTmMatch(tmResult.target)
      setTranslatedText(tmResult.target)
      setEditedTarget(tmResult.target)
      setIsLoading(false)
      return
    }

    // Fallback to API translation
    const engine = localStorage.getItem('doceditor_active_engine') || 'tencent'
    const result = await translateText({ text: textToTranslate, sourceLang, targetLang, engine })
    if (result.success && result.translatedText) {
      setTranslatedText(result.translatedText)
      setEditedTarget(result.translatedText)
      // Save to TM
      const { addPair } = useTranslationMemoryStore.getState()
      await addPair(textToTranslate, result.translatedText, sourceLang, targetLang)
      // Notify parent for bilingual view
      if (onTranslateComplete) {
        onTranslateComplete(textToTranslate, result.translatedText)
      }
    } else {
      setError(result.error || 'Translation failed')
    }
    setIsLoading(false)
  }

  // Sync editableSource when text prop changes
  useEffect(() => { setEditableSource(text) }, [text])

  useEffect(() => { doTranslate() }, [editableSource, sourceLang, targetLang])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleSaveTerm = async () => {
    try {
      await addTerm(editableSource, editedTarget || translatedText)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      toast.error('保存失败')
    }
  }

  return (
    <div ref={popupRef} style={getPopupStyle()} className="w-[320px]" onMouseDown={e => e.stopPropagation()} onMouseUp={e => e.stopPropagation()}>
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
          <span className="text-xs font-medium text-slate-600">翻译</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
          <select value={sourceLang} onChange={e => { setSourceLang(e.target.value); localStorage.setItem('doceditor_translate_source', e.target.value) }}
            className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 bg-white">
            <option value="auto">自动检测</option>
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <button onClick={() => { if (sourceLang === 'auto') return; const s = sourceLang; const t = targetLang; setSourceLang(t); setTargetLang(s); localStorage.setItem('doceditor_translate_source', t); localStorage.setItem('doceditor_translate_target', s) }}
            className="text-xs text-slate-400 hover:text-blue-500 px-1" title="交换语言">⇄</button>
          <select value={targetLang} onChange={e => { setTargetLang(e.target.value); localStorage.setItem('doceditor_translate_target', e.target.value) }}
            className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 bg-white">
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>

        {/* Content */}
        <div className="p-3">
          <div className="mb-2">
            <label className="text-xs text-slate-500 mb-1 block">原文</label>
            {/* ✅ 可编辑的源文本区域 */}
            <textarea
              value={editableSource}
              onChange={(e) => setEditableSource(e.target.value)}
              rows={Math.min(3, Math.ceil(editableSource.length / 40))}
              className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded p-2 focus:outline-none focus:border-blue-500 resize-y"
            />
            {/* ✅ 快捷收缩按钮 */}
            <div className="flex gap-1 mt-1">
              <button
                onClick={() => setEditableSource(smartTrimSelection(editableSource, 50))}
                className="text-xs px-2 py-0.5 bg-gray-100 rounded hover:bg-gray-200"
                title="收缩到当前句子"
              >
                收缩选区
              </button>
              <span className="text-xs text-gray-400">
                {editableSource.length} 字
              </span>
            </div>
          </div>

          {tmMatch && (
            <div className="mb-2 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs text-green-700">
              ✓ 翻译记忆匹配
            </div>
          )}

          <div className="mb-3">
            <label className="text-xs text-slate-500 mb-1 block">译文</label>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                翻译中...
              </div>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : isEditing ? (
              <textarea value={editedTarget} onChange={e => setEditedTarget(e.target.value)}
                className="w-full text-sm text-slate-800 bg-white border border-slate-300 rounded p-2 focus:outline-none focus:border-blue-500 resize-none" rows={3} />
            ) : (
              <p className="text-sm text-slate-800 bg-slate-50 p-2 rounded max-h-20 overflow-auto">{translatedText}</p>
            )}
          </div>

          <div className="flex gap-2">
            {!isLoading && !error && (
              <>
                <button onClick={() => setIsEditing(!isEditing)}
                  className="flex-1 px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded">
                  {isEditing ? '完成编辑' : '编辑译文'}
                </button>
                <button onClick={handleSaveTerm}
                  className={`flex-1 px-3 py-1.5 text-xs rounded ${saved ? 'bg-green-500 text-white' : 'text-white bg-blue-600 hover:bg-blue-700'}`}>
                  {saved ? '✓ 已保存' : '保存到术语库'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
