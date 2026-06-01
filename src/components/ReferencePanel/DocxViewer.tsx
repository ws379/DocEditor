import React, { useRef, useState, useEffect } from 'react'
import mammoth from 'mammoth'
import { usePanelStore } from '../../stores/panelStore'

interface DocxViewerProps {
  onDocxLoad?: (html: string) => void
}

export const DocxViewer: React.FC<DocxViewerProps> = ({ onDocxLoad }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [html, setHtml] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ✅ 持久化状态
  const { states, hydrated, hydrate, setState: setPanelState, clearState } = usePanelStore()

  // ✅ 启动时从 IndexedDB 恢复 DOCX
  useEffect(() => {
    if (!hydrated.docx) {
      hydrate('docx')
      return
    }
    const saved = states.docx
    if (saved && typeof saved.data === 'string') {
      setHtml(saved.data)
      setFileName(saved.fileName)
    }
  }, [hydrated.docx, states.docx]) // eslint-disable-line react-hooks/exhaustive-deps

  const persistDocx = async (htmlValue: string, name: string) => {
    setHtml(htmlValue)
    setFileName(name)
    onDocxLoad?.(htmlValue)
    await setPanelState('docx', { data: htmlValue, fileName: name, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const header = new Uint8Array(arrayBuffer.slice(0, 4))
      if (!(header[0] === 0x50 && header[1] === 0x4B)) {
        throw new Error(arrayBuffer.byteLength === 0 ? '文件为空' : '不是有效的 .docx 文件。旧版 .doc 请先用 Word 另存为 .docx')
      }
      const result = await mammoth.convertToHtml({ arrayBuffer })
      await persistDocx(result.value, file.name)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '加载失败'
      setError(msg.includes('Corrupted zip') ? '文件损坏或格式不正确' : msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const header = new Uint8Array(arrayBuffer.slice(0, 4))
      if (!(header[0] === 0x50 && header[1] === 0x4B)) {
        throw new Error(arrayBuffer.byteLength === 0 ? '文件为空' : '不是有效的 .docx 文件。旧版 .doc 请先用 Word 另存为 .docx')
      }
      const result = await mammoth.convertToHtml({ arrayBuffer })
      await persistDocx(result.value, file.name)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '加载失败'
      setError(msg.includes('Corrupted zip') ? '文件损坏或格式不正确' : msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = async () => {
    setHtml(null)
    setFileName(null)
    await clearState('docx')
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-400">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!html) {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="min-h-[300px] flex flex-col items-center justify-center text-slate-400"
      >
        <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm mb-2">拖放 DOCX 文件到此处</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
        >
          选择文件
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 truncate">{fileName}</span>
        <button
          onClick={handleClear}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          清除
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <div
          className="docx-preview"
          style={{
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#1e293b',
            fontFamily: 'SimSun, "Microsoft YaHei", serif',
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <style>{`
          .docx-preview h1 { font-size: 24px; font-weight: bold; margin: 16px 0 8px; }
          .docx-preview h2 { font-size: 20px; font-weight: bold; margin: 14px 0 6px; }
          .docx-preview h3 { font-size: 16px; font-weight: bold; margin: 12px 0 4px; }
          .docx-preview p { margin: 4px 0; }
          .docx-preview table { border-collapse: collapse; width: 100%; margin: 8px 0; }
          .docx-preview td, .docx-preview th { border: 1px solid #cbd5e1; padding: 4px 8px; text-align: left; }
          .docx-preview th { background: #f1f5f9; font-weight: bold; }
          .docx-preview ul, .docx-preview ol { padding-left: 24px; margin: 4px 0; }
          .docx-preview li { margin: 2px 0; }
          .docx-preview strong, .docx-preview b { font-weight: bold; }
          .docx-preview em, .docx-preview i { font-style: italic; }
          .docx-preview u { text-decoration: underline; }
          .docx-preview img { max-width: 100%; height: auto; }
          .docx-preview blockquote { border-left: 3px solid #cbd5e1; padding-left: 12px; margin: 8px 0; color: #64748b; }
          .docx-preview pre, .docx-preview code { background: #f1f5f9; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
        `}</style>
      </div>
    </div>
  )
}
