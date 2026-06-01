import React, { useEffect, useRef } from 'react'
import type { Term } from '../../services/termStorage'

interface Props {
  term: Term
  rect: DOMRect
  onReplace?: (newText: string) => void
  onClose: () => void
}

/**
 * Tooltip that appears when hovering over a highlighted term.
 * Shows the term translation and allows one-click replacement.
 */
export function TermTooltip({ term, rect, onReplace, onClose }: Props) {
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Close tooltip on scroll since rect is viewport-relative and becomes stale
    const handleScroll = () => onClose()
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [onClose])

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]"
      style={{
        top: rect.bottom + 8,
        left: rect.left,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">术语匹配</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">
          ×
        </button>
      </div>

      <div className="mb-2">
        <div className="text-sm font-medium text-gray-800">{term.source}</div>
        <div className="text-sm text-blue-600 mt-1">→ {term.target}</div>
      </div>

      {onReplace && (
        <button
          onClick={() => {
            onReplace(term.target)
            onClose()
          }}
          className="w-full px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
        >
          替换为译文
        </button>
      )}
    </div>
  )
}
