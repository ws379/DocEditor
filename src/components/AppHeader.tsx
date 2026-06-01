import React from 'react'

interface AppHeaderProps {
  title?: string
  version?: number
  saved: boolean
  translateEnabled: boolean
  focusModeEnabled: boolean
  showPanel: boolean
  onToggleSidebar: () => void
  onSave: () => void
  onImport: () => void
  onSnapshot: () => void
  onExport: () => void
  onTogglePanel: () => void
  onTermManager: () => void
  onPdfMerge: () => void
  onVersionHistory: () => void
  onToggleTranslate: () => void
  onEngineConfig: () => void
  onToggleFocusMode: () => void
  onShortcuts: () => void
}

export const AppHeader = React.memo<AppHeaderProps>(function AppHeader({
  title,
  version,
  saved,
  translateEnabled,
  focusModeEnabled,
  showPanel,
  onToggleSidebar,
  onSave,
  onImport,
  onSnapshot,
  onExport,
  onTogglePanel,
  onTermManager,
  onPdfMerge,
  onVersionHistory,
  onToggleTranslate,
  onEngineConfig,
  onToggleFocusMode,
  onShortcuts,
}) {
  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 shrink-0 no-print">
      <button
        onClick={onToggleSidebar}
        className="p-1.5 rounded-md hover:bg-gray-100 mr-3"
      >
        ☰
      </button>
      <h1 className="text-sm font-semibold text-gray-800">{title || 'DocEditor'}</h1>
      <span className="text-xs text-gray-400 ml-2">{version ? `v${version}` : ''}</span>
      <div className="ml-auto flex gap-2">
        <button
          onClick={onSave}
          className={`px-3 py-1.5 text-xs rounded ${
            saved ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {saved ? '✓ 已保存' : '保存'}
        </button>
        <button onClick={onImport} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded">
          导入
        </button>
        <button onClick={onSnapshot} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded">
          快照
        </button>
        <button
          onClick={onExport}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
        >
          导出
        </button>
        <button
          onClick={onTogglePanel}
          className={`px-3 py-1.5 text-xs rounded ${
            showPanel ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          参考
        </button>
        <button onClick={onTermManager} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded">
          术语库
        </button>
        <button onClick={onPdfMerge} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded">
          PDF合并
        </button>
        <button onClick={onVersionHistory} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded">
          版本历史
        </button>
        <button
          onClick={onToggleTranslate}
          className={`px-3 py-1.5 text-xs rounded ${
            translateEnabled ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:bg-gray-100'
          }`}
          title={translateEnabled ? '关闭划词翻译' : '开启划词翻译'}
        >
          {translateEnabled ? '译 ✓' : '译'}
        </button>
        <button onClick={onEngineConfig} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded">
          引擎配置
        </button>
        <button
          onClick={onToggleFocusMode}
          className={`px-3 py-1.5 text-xs rounded ${
            focusModeEnabled ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="专注模式"
        >
          {focusModeEnabled ? '🎯 专注' : '🎯'}
        </button>
        <button
          onClick={onShortcuts}
          className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
          title="快捷键"
        >
          ⌨
        </button>
      </div>
    </header>
  )
})
