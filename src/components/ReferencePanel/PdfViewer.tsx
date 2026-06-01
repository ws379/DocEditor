import React, { useState, useRef, useEffect, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { toast } from '../../stores/toastStore'
import { useTranslationStore } from '../../stores/translationStore'
import { usePanelStore } from '../../stores/panelStore'
import { refineToWordBoundary, smartTrimSelection } from '../../utils/selectionHelper'

// 使用 Vite 的 import.meta.url 方式加载 worker（本地，不依赖 CDN）
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export function PdfViewer() {
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.5)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [dragMode, setDragMode] = useState(false)
  const [viewMode, setViewMode] = useState<'canvas' | 'text'>('canvas')
  const [extractedText, setExtractedText] = useState<string>('')
  const [extractingText, setExtractingText] = useState(false)
  /** 按页缓存提取的文本: pageNum → text */
  const pageTextCache = useRef<Map<number, string>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const scrollStart = useRef({ x: 0, y: 0 })
  // ✅ 文本模式容器 ref，用于浏览器原生划词翻译
  const textModeRef = useRef<HTMLDivElement>(null)

  // ✅ 翻译状态
  const { translateEnabled, setTranslateSelection } = useTranslationStore()

  // ✅ 持久化状态
  const { states, hydrated, hydrate, setState: setPanelState } = usePanelStore()

  // ✅ 从 ArrayBuffer 加载 PDF（供持久化恢复和文件选择共用）
  const loadPdfFromArrayBuffer = useCallback(async (arrayBuffer: ArrayBuffer, name: string) => {
    // Validate PDF signature: %PDF
    const header = new Uint8Array(arrayBuffer.slice(0, 5))
    const isPdf = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46
    if (!isPdf) {
      throw new Error(arrayBuffer.byteLength === 0 ? '文件为空' : '不是有效的 PDF 文件')
    }
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    setPdf(pdfDoc)
    setTotalPages(pdfDoc.numPages)
    setCurrentPage(1)
    setFileName(name)
    setExtractedText('')
    pageTextCache.current.clear()
  }, [])

  // ✅ 启动时从 IndexedDB 恢复 PDF
  useEffect(() => {
    if (!hydrated.pdf) {
      hydrate('pdf')
      return
    }
    const saved = states.pdf
    if (saved && saved.data instanceof ArrayBuffer) {
      setLoading(true)
      loadPdfFromArrayBuffer(saved.data, saved.fileName).catch(() => {
        // Silently fail on restore — user can re-upload
      }).finally(() => setLoading(false))
    }
  }, [hydrated.pdf, states.pdf]) // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ 文本模式下划词翻译：直接在文本容器上监听 mouseup
  useEffect(() => {
    if (!translateEnabled || viewMode !== 'text') return
    const container = textModeRef.current
    if (!container) return

    const handleMouseUp = () => {
      setTimeout(() => {
        const sel = window.getSelection()
        if (!sel || sel.isCollapsed || !sel.rangeCount) return
        const text = sel.toString().trim()
        if (text.length < 1) return
        const range = sel.getRangeAt(0)
        if (!container.contains(range.commonAncestorContainer)) return
        let refinedText = refineToWordBoundary(text)
        refinedText = smartTrimSelection(refinedText, 5000)
        if (!refinedText) return
        setTranslateSelection({ text: refinedText, rect: range.getBoundingClientRect() })
      }, 200)
    }

    container.addEventListener('mouseup', handleMouseUp)
    return () => container.removeEventListener('mouseup', handleMouseUp)
  }, [translateEnabled, viewMode, setTranslateSelection])

  const loadPdf = useCallback(async (file: File) => {
    setLoading(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      // pdfjsLib.getDocument 会 detach ArrayBuffer，先复制一份用于持久化
      const persistCopy = arrayBuffer.slice(0)
      await loadPdfFromArrayBuffer(arrayBuffer, file.name)
      // ✅ 持久化到 IndexedDB
      await setPanelState('pdf', { data: persistCopy, fileName: file.name, mimeType: 'application/pdf' })
    } catch (err: any) {
      const msg = err?.message || '加载失败'
      toast.error(msg.includes('Invalid PDF') ? 'PDF 文件损坏或格式不正确' : msg)
    } finally {
      setLoading(false)
    }
  }, [loadPdfFromArrayBuffer, setPanelState])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await loadPdf(file)
  }, [loadPdf])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    await loadPdf(file)
  }, [loadPdf])

  // 渲染当前页（canvas + textLayer）
  // viewMode 也在依赖中：文本模式翻页后切回 canvas 模式时需要重新渲染
  useEffect(() => {
    if (!pdf || !containerRef.current) return
    let cancelled = false

    const renderPage = async () => {
      const page = await pdf.getPage(currentPage)
      const viewport = page.getViewport({ scale })

      const container = containerRef.current!
      container.innerHTML = ''

      // 包裹层（相对定位，用于叠加 canvas 和 textLayer）
      const wrapper = document.createElement('div')
      wrapper.style.position = 'relative'
      wrapper.style.width = `${viewport.width}px`
      wrapper.style.height = `${viewport.height}px`
      wrapper.style.margin = '0 auto'

      // Canvas 层
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')!
      wrapper.appendChild(canvas)

      // TextLayer（透明文字覆盖在 canvas 上，用于选中）
      const textLayerDiv = document.createElement('div')
      textLayerDiv.className = 'pdf-text-layer'
      wrapper.appendChild(textLayerDiv)

      container.appendChild(wrapper)

      // 渲染 canvas
      await page.render({ canvasContext: ctx, viewport }).promise

      if (cancelled) return

      // 渲染 textLayer
      const textContent = await page.getTextContent()
      const textLayer = new pdfjsLib.TextLayer({
        textContentSource: textContent,
        container: textLayerDiv,
        viewport,
      })
      await textLayer.render()

      // ✅ 为每个 span 添加 data-line 属性标记行号，辅助选区按行分割
      const spans = textLayerDiv.querySelectorAll('span')
      let currentTop = -1
      let lineIndex = 0
      spans.forEach(span => {
        const spanEl = span as HTMLElement
        const top = Math.round(spanEl.offsetTop)
        if (top !== currentTop) {
          currentTop = top
          lineIndex++
        }
        spanEl.dataset.line = String(lineIndex)
      })
    }

    renderPage()
    return () => { cancelled = true }
  }, [pdf, currentPage, scale, viewMode])

  const ZOOM_STEP = 0.25
  const ZOOM_MIN = 0.5
  const ZOOM_MAX = 4
  const zoomIn = () => setScale(s => Math.min(s + ZOOM_STEP, ZOOM_MAX))
  const zoomOut = () => setScale(s => Math.max(s - ZOOM_STEP, ZOOM_MIN))
  const zoomFit = () => setScale(1.5)

  // Extract text from all pages, populate per-page cache
  const extractAllText = useCallback(async () => {
    if (!pdf) return
    setExtractingText(true)
    const cache = new Map<number, string>()
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join('')
      cache.set(i, pageText)
    }
    pageTextCache.current = cache
    setExtractedText(cache.get(currentPage) || '')
    setExtractingText(false)
  }, [pdf, currentPage])

  // ✅ 翻页时更新文本为当前页
  useEffect(() => {
    if (viewMode !== 'text') return
    const cached = pageTextCache.current.get(currentPage)
    if (cached !== undefined) {
      setExtractedText(cached)
    } else if (pdf) {
      setExtractingText(true)
      pdf.getPage(currentPage)
        .then(page => page.getTextContent())
        .then(textContent => {
          const pageText = textContent.items.map((item: any) => item.str).join('')
          pageTextCache.current.set(currentPage, pageText)
          setExtractedText(pageText)
        })
        .catch(() => setExtractedText(''))
        .finally(() => setExtractingText(false))
    }
  }, [currentPage, viewMode, pdf])

  // ✅ 拖拽平移（仅拖拽模式下生效）
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || !dragMode) return
    const container = containerRef.current
    if (!container) return
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    scrollStart.current = { x: container.scrollLeft, y: container.scrollTop }
    container.style.cursor = 'grabbing'
  }, [dragMode])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      containerRef.current.scrollLeft = scrollStart.current.x - dx
      containerRef.current.scrollTop = scrollStart.current.y - dy
    }
    const handleMouseUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      if (containerRef.current) {
        containerRef.current.style.cursor = dragMode ? 'grab' : 'text'
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragMode])

  // ✅ Alt+S 快捷键切换拖拽模式
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 's') {
        e.preventDefault()
        setDragMode(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 滚轮缩放 (Ctrl+滚轮)
  const WHEEL_ZOOM_STEP = 0.15
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey) return
    e.preventDefault()
    const delta = e.deltaY > 0 ? -WHEEL_ZOOM_STEP : WHEEL_ZOOM_STEP
    setScale(s => Math.min(Math.max(s + delta, ZOOM_MIN), ZOOM_MAX))
  }, [])

  if (!pdf) {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className="flex flex-col items-center justify-center min-h-[300px] text-slate-400 border-2 border-dashed border-slate-200 rounded-lg hover:border-blue-400 transition-colors"
      >
        <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <p className="text-sm mb-1">拖放 PDF 到此处，或</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          选择文件
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-2 mb-2 flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="px-2 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200">
            更换文件
          </button>
          <span className="text-xs text-slate-500 truncate max-w-[200px]">{fileName}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
            className="px-2 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-40">◀</button>
          <span className="text-xs text-slate-600">{currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
            className="px-2 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-40">▶</button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={zoomOut} className="px-2 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200" title="缩小">−</button>
          <span className="text-xs text-slate-600 min-w-[40px] text-center">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="px-2 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200" title="放大">+</button>
          <button onClick={zoomFit} className="px-2 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200" title="重置缩放">⊡</button>
          <div className="w-px h-4 bg-slate-200 mx-0.5" />
          <button onClick={() => setDragMode(!dragMode)}
            className={`px-2 py-1 text-xs rounded ${dragMode ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 hover:bg-slate-200'}`}
            title={dragMode ? '拖拽模式（Alt+S 切换）' : '选中模式（Alt+S 切换）'}>
            {dragMode ? '✋ 拖拽' : '🔤 选中'}
          </button>
          <div className="w-px h-4 bg-slate-200 mx-0.5" />
          <button onClick={() => {
            if (viewMode === 'text') {
              setViewMode('canvas')
            } else {
              setViewMode('text')
              if (!extractedText) extractAllText()
            }
          }}
            className={`px-2 py-1 text-xs rounded ${viewMode === 'text' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 hover:bg-slate-200'}`}
            title={viewMode === 'text' ? '切换为渲染视图' : '切换为文本视图（可跨页选择）'}>
            {viewMode === 'text' ? '📄 文本' : '🖼 渲染'}
          </button>
          <span className="text-[10px] text-slate-400 ml-1">Ctrl+滚轮缩放 | Alt+S 切换模式</span>
        </div>
      </div>

      {/* Canvas 模式：纯渲染视图 */}
      {viewMode === 'canvas' && (
        <div
          ref={containerRef}
          className="flex-1 overflow-auto border rounded bg-gray-50 relative"
          style={{ cursor: dragMode ? 'grab' : 'text' }}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
        />
      )}

      {/* 文本模式：PDF 渲染 + 文本在同一个滚动区域，PDF 在上文本在下 */}
      {viewMode === 'text' && (
        <div ref={textModeRef} className="flex-1 overflow-auto border rounded bg-white">
          <div ref={containerRef} className="relative bg-gray-50" />
          <div className="p-4">
            {extractingText ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                正在提取文本...
              </div>
            ) : (
              <pre className="text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed select-text">
                {extractedText || '点击"文本"按钮提取全文'}
              </pre>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* TextLayer 样式 — 完全透明，选区高亮清晰可见 */}
      <style>{`
        .pdf-text-layer {
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          opacity: 0;
          line-height: 1.0;
        }
        .pdf-text-layer > span {
          color: transparent;
          position: absolute;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
          display: inline-block;
          overflow: hidden;
          user-select: text;
        }
        .pdf-text-layer > span::selection {
          background: rgba(59, 130, 246, 0.5);
        }
        .pdf-text-layer > span::-moz-selection {
          background: rgba(59, 130, 246, 0.5);
        }
        .pdf-text-layer > br {
          display: block;
          content: '';
          margin-top: 0;
          user-select: none;
        }
      `}</style>
    </div>
  )
}
