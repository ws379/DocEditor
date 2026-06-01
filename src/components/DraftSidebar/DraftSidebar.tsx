import React, { useState } from 'react'
import { useDraftStore } from '../../stores/draftStore'
import { useLiveDrafts } from '../../hooks/useLiveDrafts'

export function DraftSidebar() {
  // useLiveDrafts provides reactive updates from IndexedDB
  // useDraftStore().drafts provides instant data from Zustand store
  const liveDrafts = useLiveDrafts()
  const storeDrafts = useDraftStore((s) => s.drafts)
  const { current, loadDraft, handleNew, handleDelete, handleRename } = useDraftStore()
  // Prefer live drafts when available, fall back to store drafts
  const drafts = liveDrafts.length > 0 ? liveDrafts : storeDrafts
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const filtered = drafts.filter(d => d.title.toLowerCase().includes(search.toLowerCase()))
  const fmt = (ts: number) => { const diff = Date.now() - ts; if (diff < 60000) return '刚刚'; if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`; if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`; return new Date(ts).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) }

  return (
    <div className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="p-3 border-b border-gray-100 flex gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索草稿..." className="flex-1 h-8 text-xs px-2 border border-gray-200 rounded focus:outline-none focus:border-blue-400" />
        <button onClick={() => handleNew()} className="h-8 w-8 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center text-lg" title="新建">+</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? <div className="p-4 text-center text-xs text-gray-400">{search ? '无匹配' : '暂无草稿'}</div> :
          filtered.map(d => (
            <div key={d.id} onClick={() => loadDraft(d.id)} className={`group px-3 py-2.5 cursor-pointer border-b border-gray-50 ${current?.id === d.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : 'hover:bg-gray-50'}`}>
              {editingId === d.id ? (
                <input autoFocus value={editTitle} onChange={e => setEditTitle(e.target.value)} onBlur={() => { if (editTitle.trim()) handleRename(d.id, editTitle.trim()); setEditingId(null) }} onKeyDown={e => { if (e.key === 'Enter') { if (editTitle.trim()) handleRename(d.id, editTitle.trim()); setEditingId(null) } }} onClick={e => e.stopPropagation()} className="w-full text-xs px-1 py-0.5 border border-blue-300 rounded focus:outline-none" />
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-800 truncate">{d.title}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <button onClick={e => { e.stopPropagation(); setEditingId(d.id); setEditTitle(d.title) }} className="p-0.5 rounded hover:bg-gray-200" title="重命名">✏️</button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(d.id) }} className="p-0.5 rounded hover:bg-red-100" title="删除">🗑️</button>
                  </div>
                </div>
              )}
              <div className="text-[10px] text-gray-400 mt-1">{fmt(d.updatedAt)} · v{d.version}</div>
            </div>
          ))}
      </div>
    </div>
  )
}
