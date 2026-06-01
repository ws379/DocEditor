import React, { useRef, useState } from 'react'
import { importFile, SUPPORTED_IMPORT_TYPES, ImportResult } from '../../services/importDoc'
import { useEditorStore } from '../../stores/editorStore'

interface Props {
  onImport: (result: ImportResult) => void
}

export const ImportModal: React.FC<Props> = ({ onImport }) => {
  const { showImport, setShowImport } = useEditorStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!showImport) return null

  const onClose = () => setShowImport(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await importFile(file)
      onImport(result)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
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
      const result = await importFile(file)
      onImport(result)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">导入文档</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
        >
          <svg className="w-12 h-12 mx-auto text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>

          <p className="text-slate-600 mb-2">
            拖放文件到此处，或
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? '导入中...' : '选择文件'}
          </button>

          <p className="text-xs text-slate-400 mt-4">
            支持格式: {SUPPORTED_IMPORT_TYPES.join(', ')}
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_IMPORT_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  )
}
