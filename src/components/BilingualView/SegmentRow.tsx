import React, { useState, useEffect, useRef } from 'react'

interface Props {
  source: string
  target: string
  index: number
  onTargetChange?: (index: number, newTarget: string) => void
}

/**
 * A single bilingual segment row - target only (source shown in left panel).
 */
export function SegmentRow({ source, target, index, onTargetChange }: Props) {
  const [localValue, setLocalValue] = useState(target)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync external changes
  useEffect(() => {
    setLocalValue(target)
  }, [target])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [localValue])

  const handleChange = (value: string) => {
    setLocalValue(value)

    // Debounce save - 500ms
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      if (onTargetChange) {
        onTargetChange(index, value)
      }
    }, 500)
  }

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  return (
    <div className="p-3 border-b border-gray-100 hover:bg-gray-50">
      {onTargetChange ? (
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full resize-none border-0 bg-transparent text-sm text-gray-800 focus:outline-none focus:ring-0 overflow-hidden"
          rows={1}
          placeholder="输入译文..."
        />
      ) : (
        <span className="text-sm text-gray-800">{target}</span>
      )}
    </div>
  )
}
