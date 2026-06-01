import React, { useState, useRef, useCallback } from 'react'
import { SegmentRow } from './SegmentRow'

interface Segment {
  source: string
  target: string
}

interface Props {
  segments: Segment[]
  onSegmentChange?: (index: number, newTarget: string) => void
  onSegmentDelete?: (index: number) => void
  onSave?: () => void
  onClear?: () => void
  onExport?: () => void
  syncScroll?: boolean
}

/**
 * Bilingual parallel view showing source and target text side by side.
 * Supports synchronized scrolling between panels.
 */
export function BilingualView({ segments, onSegmentChange, onSegmentDelete, onSave, onClear, onExport, syncScroll = true }: Props) {
  const sourceRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLDivElement>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSourceScroll = useCallback(() => {
    if (!syncScroll || isSyncing) return
    setIsSyncing(true)
    if (sourceRef.current && targetRef.current) {
      targetRef.current.scrollTop = sourceRef.current.scrollTop
    }
    requestAnimationFrame(() => setIsSyncing(false))
  }, [syncScroll, isSyncing])

  const handleTargetScroll = useCallback(() => {
    if (!syncScroll || isSyncing) return
    setIsSyncing(true)
    if (sourceRef.current && targetRef.current) {
      sourceRef.current.scrollTop = targetRef.current.scrollTop
    }
    requestAnimationFrame(() => setIsSyncing(false))
  }, [syncScroll, isSyncing])

  const handleSave = () => {
    if (onSave) {
      onSave()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  if (segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm gap-3">
        <p>暂无双语对照内容</p>
        <p className="text-xs text-gray-400">在编辑器中选词翻译后，句对会自动添加到这里</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
        <span className="text-xs text-gray-500">{segments.length} 条句对</span>
        <div className="flex gap-1">
          <button
            onClick={handleSave}
            className={`px-2 py-1 text-xs rounded ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {saved ? '✓ 已保存' : '保存'}
          </button>
          {onExport && (
            <button
              onClick={onExport}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            >
              导出
            </button>
          )}
          {onClear && (
            <button
              onClick={onClear}
              className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded"
            >
              清空
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <div className="flex-1 px-3 py-2 text-xs font-medium text-gray-500 border-r border-gray-200">
          原文
        </div>
        <div className="flex-1 px-3 py-2 text-xs font-medium text-gray-500">
          译文
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Source panel */}
        <div
          ref={sourceRef}
          className="flex-1 overflow-auto border-r border-gray-200"
          onScroll={handleSourceScroll}
        >
          {segments.map((seg, i) => (
            <div key={i} className="flex border-b border-gray-100 group">
              <div className="flex-1 p-3 text-sm text-gray-800">
                <span className="text-xs text-gray-400 mr-2">{i + 1}</span>
                {seg.source}
              </div>
              {onSegmentDelete && (
                <button
                  onClick={() => onSegmentDelete(i)}
                  className="px-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="删除"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Target panel */}
        <div
          ref={targetRef}
          className="flex-1 overflow-auto"
          onScroll={handleTargetScroll}
        >
          {segments.map((seg, i) => (
            <SegmentRow
              key={i}
              source={seg.source}
              target={seg.target}
              index={i}
              onTargetChange={onSegmentChange}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
