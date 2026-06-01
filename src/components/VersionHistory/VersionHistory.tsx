import React, { useState } from 'react'
import { saveVersion } from '../../utils/storage'
import { generateId } from '../../utils/id'
import type { VersionSnapshot } from '../../types/editor.types'
import { useEditorStore } from '../../stores/editorStore'
import { useLiveVersions } from '../../hooks/useLiveDrafts'

interface Props {
  draftId: string
  currentContent: string
  onRestore: (content: string) => void
}

export const VersionHistory: React.FC<Props> = ({
  draftId,
  currentContent,
  onRestore,
}) => {
  const { showVersionHistory, setShowVersionHistory } = useEditorStore()
  const versions = useLiveVersions(draftId)
  const [selectedVersion, setSelectedVersion] = useState<VersionSnapshot | null>(null)

  const handleSaveCurrent = async () => {
    const version: VersionSnapshot = {
      id: generateId(),
      draftId,
      content: currentContent,
      createdAt: Date.now(),
      label: `手动保存 ${new Date().toLocaleString('zh-CN')}`,
    }

    await saveVersion(version)
  }

  const onClose = () => setShowVersionHistory(false)

  const handleRestore = () => {
    if (selectedVersion) {
      onRestore(selectedVersion.content)
      onClose()
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getContentPreview = (content: string, maxLength: number = 100) => {
    const text = content.replace(/<[^>]*>/g, '')
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
  }

  if (!showVersionHistory) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">版本历史</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-b border-slate-200">
          <button
            onClick={handleSaveCurrent}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            保存当前版本
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Version list */}
          <div className="w-1/2 border-r border-slate-200 overflow-auto">
            {versions.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <p className="text-sm">暂无版本记录</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {versions.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => setSelectedVersion(version)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                      selectedVersion?.id === version.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <p className="text-sm text-slate-800">{version.label}</p>
                    <p className="text-xs text-slate-500">{formatDate(version.createdAt)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="w-1/2 overflow-auto p-4">
            {selectedVersion ? (
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">预览</h3>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">
                    {getContentPreview(selectedVersion.content, 500)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8">
                <p className="text-sm">选择版本查看预览</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            取消
          </button>
          <button
            onClick={handleRestore}
            disabled={!selectedVersion}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            恢复此版本
          </button>
        </div>
      </div>
    </div>
  )
}
