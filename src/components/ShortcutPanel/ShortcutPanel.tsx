import React from 'react'

const shortcuts = [
  { category: '文本格式', items: [
    { keys: 'Ctrl+B', action: '加粗' },
    { keys: 'Ctrl+I', action: '斜体' },
    { keys: 'Ctrl+U', action: '下划线' },
    { keys: 'Ctrl+Shift+S', action: '删除线' },
    { keys: 'Ctrl+Shift+H', action: '高亮' },
  ]},
  { category: '段落', items: [
    { keys: 'Ctrl+Shift+1~6', action: '标题 H1-H6' },
    { keys: 'Tab', action: '增加缩进' },
    { keys: 'Shift+Tab', action: '减少缩进' },
    { keys: 'Ctrl+Shift+7', action: '有序列表' },
    { keys: 'Ctrl+Shift+8', action: '无序列表' },
    { keys: 'Ctrl+Shift+9', action: '待办列表' },
  ]},
  { category: '编辑', items: [
    { keys: 'Ctrl+Z', action: '撤销' },
    { keys: 'Ctrl+Y', action: '重做' },
    { keys: 'Ctrl+F', action: '查找' },
    { keys: 'Ctrl+H', action: '替换' },
  ]},
  { category: '插入', items: [
    { keys: 'Ctrl+Shift+P', action: '分页符' },
  ]},
]

interface ShortcutPanelProps {
  onClose: () => void
}

export function ShortcutPanel({ onClose }: ShortcutPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">快捷键</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {shortcuts.map(group => (
          <div key={group.category} className="mb-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">{group.category}</h3>
            <div className="space-y-1">
              {group.items.map(item => (
                <div key={item.keys} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.action}</span>
                  <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">{item.keys}</kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
