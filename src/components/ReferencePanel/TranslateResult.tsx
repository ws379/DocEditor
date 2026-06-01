import React, { useState, useEffect } from 'react'
import { translateText } from '../../services/translateApi'
import { matchTerms, Term } from '../../services/termStorage'

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

interface TranslateResultProps {
  text?: string
  onTranslate?: (text: string) => void
}

interface TranslationEntry {
  id: string
  source: string
  translated: string
  engine: string
  timestamp: number
  matchedTerms: Term[]
}

export const TranslateResult: React.FC<TranslateResultProps> = ({ text, onTranslate }) => {
  const [inputText, setInputText] = useState(text || '')
  const [translations, setTranslations] = useState<TranslationEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sourceLang, setSourceLang] = useState(() => localStorage.getItem('doceditor_translate_source') || 'auto')
  const [targetLang, setTargetLang] = useState(() => localStorage.getItem('doceditor_translate_target') || 'zh')

  useEffect(() => {
    if (text) {
      setInputText(text)
    }
  }, [text])

  const handleTranslate = async () => {
    if (!inputText.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const engine = localStorage.getItem('doceditor_active_engine') || 'tencent'
      const result = await translateText({
        text: inputText,
        sourceLang,
        targetLang,
        engine,
      })

      if (result.success && result.translatedText) {
        // Match terms in source text
        const matchedTerms = await matchTerms(inputText)

        const entry: TranslationEntry = {
          id: `trans_${Date.now()}`,
          source: inputText,
          translated: result.translatedText,
          engine: result.engine || 'default',
          timestamp: Date.now(),
          matchedTerms,
        }

        setTranslations((prev) => [entry, ...prev])
        onTranslate?.(inputText)
      } else {
        setError(result.error || 'Translation failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed')
    } finally {
      setIsLoading(false)
    }
  }

  const highlightTerms = (text: string, terms: Term[]) => {
    if (terms.length === 0) return text

    let result = text
    for (const term of terms) {
      const regex = new RegExp(`(${term.source})`, 'gi')
      result = result.replace(regex, `<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>`)
    }
    return result
  }

  return (
    <div className="h-full flex flex-col">
      {/* Language selector */}
      <div className="flex items-center gap-2 mb-2">
        <select value={sourceLang} onChange={e => { setSourceLang(e.target.value); localStorage.setItem('doceditor_translate_source', e.target.value) }}
          className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white">
          <option value="auto">自动检测</option>
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
        <button onClick={() => { if (sourceLang === 'auto') return; const s = sourceLang; const t = targetLang; setSourceLang(t); setTargetLang(s); localStorage.setItem('doceditor_translate_source', t); localStorage.setItem('doceditor_translate_target', s) }}
          className="text-xs text-slate-400 hover:text-blue-500 px-1" title="交换语言">⇄</button>
        <select value={targetLang} onChange={e => { setTargetLang(e.target.value); localStorage.setItem('doceditor_translate_target', e.target.value) }}
          className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white">
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>

      {/* Input */}
      <div className="mb-3">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="输入要翻译的文本..."
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
          rows={4}
        />
        <button
          onClick={handleTranslate}
          disabled={isLoading || !inputText.trim()}
          className="mt-2 w-full px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
        >
          {isLoading ? '翻译中...' : '翻译'}
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Translation history */}
      <div className="flex-1 overflow-auto">
        {translations.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <p className="text-sm">输入文本开始翻译</p>
          </div>
        ) : (
          <div className="space-y-3">
            {translations.map((entry) => (
              <div key={entry.id} className="bg-slate-50 rounded-lg p-3">
                {/* Source with highlighted terms */}
                <div className="mb-2">
                  <label className="text-xs text-slate-500 mb-1 block">原文</label>
                  <p
                    className="text-sm text-slate-800"
                    dangerouslySetInnerHTML={{
                      __html: highlightTerms(entry.source, entry.matchedTerms),
                    }}
                  />
                </div>

                {/* Translation */}
                <div className="mb-2">
                  <label className="text-xs text-slate-500 mb-1 block">译文</label>
                  <p className="text-sm text-slate-800">{entry.translated}</p>
                </div>

                {/* Matched terms */}
                {entry.matchedTerms.length > 0 && (
                  <div className="mb-2">
                    <label className="text-xs text-slate-500 mb-1 block">匹配术语</label>
                    <div className="flex flex-wrap gap-1">
                      {entry.matchedTerms.map((term) => (
                        <span
                          key={term.id}
                          className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded"
                        >
                          {term.source} → {term.target}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>引擎: {entry.engine}</span>
                  <span>{new Date(entry.timestamp).toLocaleTimeString('zh-CN')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
