import React, { useCallback } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { useDraftStore } from '../../stores/draftStore'
import { useEditorInstance } from '../Editor/EditorInstanceContext'
import { useExport } from '../../hooks/useExport'

export function ExportModal() {
  const { setShowExport } = useEditorStore()
  const { current } = useDraftStore()
  const { editor } = useEditorInstance()
  const getContent = useCallback(() => editor?.getHTML() || '', [editor])
  const { handleExportHtml, handleExportDocx, handleExportPdf, handleExportMd } = useExport({ current, getContent })

  const onClose = () => setShowExport(false)

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-80" onClick={e => e.stopPropagation()}>
        <h2 className="text-sm font-semibold mb-4">导出文档</h2>
        <div className="space-y-2">
          <button onClick={() => { handleExportDocx(); onClose() }} className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center gap-2">
            <span>📝</span><span>Word (.docx)</span>
          </button>
          <button onClick={() => { handleExportPdf(); onClose() }} className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center gap-2">
            <span>📄</span><span>PDF (.pdf)</span>
          </button>
          <button onClick={() => { handleExportHtml(); onClose() }} className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center gap-2">
            <span>🌐</span><span>HTML (.html)</span>
          </button>
          <button onClick={() => { handleExportMd(); onClose() }} className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center gap-2">
            <span>📋</span><span>Markdown (.md)</span>
          </button>
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2 text-xs text-gray-500 hover:bg-gray-100 rounded">取消</button>
      </div>
    </div>
  )
}
