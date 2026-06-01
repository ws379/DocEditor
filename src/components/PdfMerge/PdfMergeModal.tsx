import React, { useState, useRef } from 'react'
import { mergePdfs, downloadPdf, getPdfInfo, PdfInfo, formatFileSize } from '../../services/pdfMerge'
import { useEditorStore } from '../../stores/editorStore'
import { toast } from '../../stores/toastStore'

export const PdfMergeModal: React.FC = () => {
  const { showPdfMerge, setShowPdfMerge } = useEditorStore()
  const [pdfFiles, setPdfFiles] = useState<PdfInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMerging, setIsMerging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!showPdfMerge) return null

  const onClose = () => setShowPdfMerge(false)

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setIsLoading(true)
    const newPdfs: PdfInfo[] = []

    for (const file of files) {
      try {
        const info = await getPdfInfo(file)
        newPdfs.push(info)
      } catch (err) {
        console.error(`Failed to load ${file.name}:`, err)
      }
    }

    setPdfFiles((prev) => [...prev, ...newPdfs])
    setIsLoading(false)
  }

  const handleRemove = (index: number) => {
    setPdfFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    setPdfFiles((prev) => {
      const newFiles = [...prev]
      ;[newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]]
      return newFiles
    })
  }

  const handleMoveDown = (index: number) => {
    setPdfFiles((prev) => {
      if (index === prev.length - 1) return prev
      const newFiles = [...prev]
      ;[newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]]
      return newFiles
    })
  }

  const handleMerge = async () => {
    if (pdfFiles.length < 2) {
      toast.info('请至少添加两个 PDF 文件')
      return
    }

    setIsMerging(true)
    try {
      const files = pdfFiles.map((info) => info.file)
      const mergedBlob = await mergePdfs(files)
      downloadPdf(mergedBlob, 'merged.pdf')
      onClose()
    } catch (err) {
      toast.error(`合并失败: ${err instanceof Error ? err.message : '未知错误'}`)
    } finally {
      setIsMerging(false)
    }
  }

  const totalPages = pdfFiles.reduce((sum, info) => sum + info.pageCount, 0)
  const totalSize = pdfFiles.reduce((sum, info) => sum + info.size, 0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">PDF 合并</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Add files */}
        <div className="px-4 py-3 border-b border-slate-200">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            {isLoading ? '加载中...' : '点击添加 PDF 文件'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleAddFiles}
            className="hidden"
          />
        </div>

        {/* File list */}
        <div className="flex-1 overflow-auto px-4 py-3">
          {pdfFiles.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">添加 PDF 文件开始合并</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pdfFiles.map((info, index) => (
                <div
                  key={`${info.name}-${index}`}
                  className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                >
                  <span className="text-xs text-slate-400 w-6">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 truncate">{info.name}</p>
                    <p className="text-xs text-slate-500">
                      {info.pageCount} 页 · {formatFileSize(info.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === pdfFiles.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleRemove(index)}
                    className="p-1 text-red-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            {pdfFiles.length} 个文件 · {totalPages} 页 · {formatFileSize(totalSize)}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              取消
            </button>
            <button
              onClick={handleMerge}
              disabled={pdfFiles.length < 2 || isMerging}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {isMerging ? '合并中...' : '合并'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
