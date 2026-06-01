import React, { useState, useRef } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { useTermStore } from '../../stores/termStore'
import { useLiveTerms } from '../../hooks/useLiveDrafts'
import { toast } from '../../stores/toastStore'

export const TermManager: React.FC = () => {
  const { showTermManager, setShowTermManager } = useEditorStore()
  const { handleAddTerm, handleUpdateTerm, handleDeleteTerm, importFromJson, importFromCsv, exportToJson, exportToCsv } = useTermStore()
  const terms = useLiveTerms()
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSource, setEditSource] = useState('')
  const [editTarget, setEditTarget] = useState('')
  const [newSource, setNewSource] = useState('')
  const [newTarget, setNewTarget] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importMode, setImportMode] = useState<'json' | 'csv'>('json')

  const filteredTerms = terms.filter(
    (term) =>
      term.source.toLowerCase().includes(search.toLowerCase()) ||
      term.target.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async () => {
    if (!newSource.trim() || !newTarget.trim()) return
    await handleAddTerm(newSource.trim(), newTarget.trim())
    setNewSource('')
    setNewTarget('')
  }

  const handleEdit = (term: { id: string; source: string; target: string }) => {
    setEditingId(term.id)
    setEditSource(term.source)
    setEditTarget(term.target)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editSource.trim() || !editTarget.trim()) return
    await handleUpdateTerm(editingId, editSource.trim(), editTarget.trim())
    setEditingId(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('确定删除此术语？')) {
      await handleDeleteTerm(id)
    }
  }

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const count = await importFromJson(text)
      toast.success(`成功导入 ${count} 条术语`)
    } catch {
      toast.error('导入失败：JSON 格式错误')
    }
  }

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const count = await importFromCsv(text)
      toast.success(`成功导入 ${count} 条术语`)
    } catch {
      toast.error('导入失败：CSV 格式错误')
    }
  }

  const handleExportJson = async () => {
    const json = await exportToJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'terms.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCsv = async () => {
    const csv = await exportToCsv()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'terms.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!showTermManager) return null

  const onClose = () => setShowTermManager(false)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">术语库管理</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-b border-slate-200 flex gap-2">
          <button
            onClick={() => { setImportMode('json'); fileInputRef.current?.click() }}
            className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded"
          >
            导入 JSON
          </button>
          <button
            onClick={() => { setImportMode('csv'); fileInputRef.current?.click() }}
            className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded"
          >
            导入 CSV
          </button>
          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded"
          >
            导出 JSON
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded"
          >
            导出 CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={importMode === 'json' ? '.json' : '.csv'}
            onChange={importMode === 'json' ? handleImportJson : handleImportCsv}
            className="hidden"
          />
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-200">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索术语..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Add new term */}
        <div className="px-4 py-3 border-b border-slate-200 flex gap-2">
          <input
            type="text"
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
            placeholder="原文"
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            placeholder="译文"
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleAdd}
            disabled={!newSource.trim() || !newTarget.trim()}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            添加
          </button>
        </div>

        {/* Terms list */}
        <div className="flex-1 overflow-auto px-4 py-3">
          {filteredTerms.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              {search ? '没有匹配的术语' : '术语库为空'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredTerms.map((term) => (
                <div
                  key={term.id}
                  className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                >
                  {editingId === term.id ? (
                    <>
                      <input
                        type="text"
                        value={editSource}
                        onChange={(e) => setEditSource(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-slate-400">→</span>
                      <input
                        type="text"
                        value={editTarget}
                        onChange={(e) => setEditTarget(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="px-2 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded"
                      >
                        保存
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-2 py-1 text-xs text-slate-600 bg-slate-200 hover:bg-slate-300 rounded"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-slate-800">{term.source}</span>
                      <span className="text-slate-400">→</span>
                      <span className="flex-1 text-sm text-slate-800">{term.target}</span>
                      <button
                        onClick={() => handleEdit(term)}
                        className="px-2 py-1 text-xs text-slate-600 bg-slate-200 hover:bg-slate-300 rounded"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(term.id)}
                        className="px-2 py-1 text-xs text-red-600 bg-red-100 hover:bg-red-200 rounded"
                      >
                        删除
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 text-xs text-slate-500">
          共 {terms.length} 条术语
        </div>
      </div>
    </div>
  )
}
