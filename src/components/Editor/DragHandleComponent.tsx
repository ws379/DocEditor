import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useEditorInstance } from './EditorInstanceContext'

/**
 * Custom DragHandle component that shows a grip icon next to the hovered block node.
 * Replaces @tiptap/extension-drag-handle which has initialization issues.
 */
export function DragHandleComponent() {
  const { editor } = useEditorInstance()
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [nodePos, setNodePos] = useState<number | null>(null)
  const dragRef = useRef<HTMLDivElement>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const HIDE_DELAY_MS = 150
  const HANDLE_OFFSET_PX = 28

  // Find the nearest block-level parent node of an element
  const findBlockNode = useCallback((element: HTMLElement): { node: HTMLElement; pos: number } | null => {
    if (!editor) return null
    const { view } = editor

    // Walk up to find the block-level element
    let el: HTMLElement | null = element
    while (el && el !== view.dom) {
      if (el.parentElement === view.dom || el.matches('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, table, hr, ul, ol')) {
        const pos = view.posAtDOM(el, 0)
        if (pos >= 0) {
          return { node: el, pos }
        }
      }
      el = el.parentElement
    }
    return null
  }, [editor])

  useEffect(() => {
    if (!editor) return
    const container = editor.view.dom

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!container.contains(target)) return

      // Don't hide when hovering over the drag handle itself
      if (dragRef.current?.contains(target)) {
        if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null }
        return
      }

      const block = findBlockNode(target)
      if (block) {
        if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null }
        const rect = block.node.getBoundingClientRect()
        setPos({
          top: rect.top,
          left: rect.left - HANDLE_OFFSET_PX,
        })
        setNodePos(block.pos)
        setVisible(true)
      }
    }

    const handleMouseLeave = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement | null
      if (dragRef.current?.contains(related)) return
      hideTimerRef.current = setTimeout(() => setVisible(false), HIDE_DELAY_MS)
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [editor, findBlockNode])

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!editor || nodePos === null) return
    const { state } = editor
    const node = state.doc.nodeAt(nodePos)
    if (!node) return

    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', node.textContent)

    // Create a minimal drag preview
    const preview = document.createElement('div')
    preview.textContent = node.textContent?.substring(0, 50) || '...'
    preview.style.cssText = 'position:absolute;top:-1000px;padding:4px 8px;background:#f3f4f6;border-radius:4px;font-size:12px;'
    document.body.appendChild(preview)
    e.dataTransfer.setDragImage(preview, 0, 0)
    setTimeout(() => document.body.removeChild(preview), 0)
  }, [editor, nodePos])

  if (!visible || !editor) return null

  return (
    <div
      ref={dragRef}
      className="drag-handle"
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
      }}
      draggable
      onDragStart={handleDragStart}
    >
      <svg width="14" height="18" viewBox="0 0 14 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="4" cy="4" r="1.5"/>
        <circle cx="10" cy="4" r="1.5"/>
        <circle cx="4" cy="9" r="1.5"/>
        <circle cx="10" cy="9" r="1.5"/>
        <circle cx="4" cy="14" r="1.5"/>
        <circle cx="10" cy="14" r="1.5"/>
      </svg>
    </div>
  )
}
