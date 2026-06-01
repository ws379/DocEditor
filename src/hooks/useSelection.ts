import { useState, useEffect, useCallback, useRef, RefObject } from 'react'

interface SelectionState {
  text: string
  rect: DOMRect | null
  isCollapsed: boolean
}

interface UseSelectionOptions {
  containerRef?: RefObject<HTMLElement>
  onSelect?: (text: string, rect: DOMRect) => void
  enabled?: boolean
  minLength?: number   // 最小选择长度，默认 1
  maxLength?: number   // 最大选择长度，默认 200
  debounceMs?: number  // 防抖毫秒数，默认 300
  ready?: boolean      // 容器是否已就绪（用于条件渲染的容器）
}

export function useSelection(options: UseSelectionOptions = {}) {
  const {
    minLength = 1,
    maxLength = 200,
    debounceMs = 300,
  } = options

  const [selection, setSelection] = useState<SelectionState>({
    text: '',
    rect: null,
    isCollapsed: true,
  })

  // onSelect 用 ref 避免闭包问题
  const onSelectRef = useRef(options.onSelect)
  useEffect(() => { onSelectRef.current = options.onSelect }, [options.onSelect])

  // enabled 用 ref 保持最新值，避免闭包读到旧值
  const enabledRef = useRef(options.enabled)
  useEffect(() => { enabledRef.current = options.enabled }, [options.enabled])

  // containerRef 用 ref 保持最新值
  const containerRefRef = useRef(options.containerRef)
  useEffect(() => { containerRefRef.current = options.containerRef }, [options.containerRef])

  const updateSelection = useCallback(() => {
    if (enabledRef.current === false) return

    const sel = window.getSelection()

    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setSelection((prev) => ({ ...prev, isCollapsed: true }))
      return
    }

    const text = sel.toString().trim()

    if (!text) {
      setSelection((prev) => ({ ...prev, isCollapsed: true }))
      return
    }

    // ✅ 长度限制：太短或太长都不触发
    if (text.length < minLength || text.length > maxLength) {
      if (text.length > maxLength) {
        console.warn(`选中文本过长（${text.length}字），最大支持${maxLength}字`)
      }
      return
    }

    const range = sel.getRangeAt(0)
    const container = containerRefRef.current?.current
    if (container && !container.contains(range.commonAncestorContainer)) {
      return
    }

    const rect = range.getBoundingClientRect()

    setSelection({ text, rect, isCollapsed: false })

    if (onSelectRef.current) {
      onSelectRef.current(text, rect)
    }
  }, [minLength, maxLength])

  const clearSelection = useCallback(() => {
    setSelection({ text: '', rect: null, isCollapsed: true })
    window.getSelection()?.removeAllRanges()
  }, [])

  // ✅ 用 ref 读取最新 enabled/container，事件处理器内部实时读取，不靠闭包
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const handleMouseUp = (e: MouseEvent) => {
      const container = containerRefRef.current?.current
      // 只处理目标在容器内的 mouseup（如果有容器的话）
      if (container && !container.contains(e.target as Node)) return
      clearTimeout(timer)
      timer = setTimeout(updateSelection, debounceMs)
    }

    const handleKeyUp = (e: Event) => {
      const keyEvent = e as KeyboardEvent
      if (keyEvent.shiftKey && keyEvent.key.startsWith('Arrow')) {
        const container = containerRefRef.current?.current
        if (container && !container.contains(document.activeElement)) return
        clearTimeout(timer)
        timer = setTimeout(updateSelection, debounceMs)
      }
    }

    // ✅ selectionchange 是浏览器原生选区变化事件，比 mouseup 更可靠
    const handleSelectionChange = () => {
      const container = containerRefRef.current?.current
      if (!container) return
      clearTimeout(timer)
      timer = setTimeout(updateSelection, debounceMs)
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('keyup', handleKeyUp)
    document.addEventListener('selectionchange', handleSelectionChange)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('selectionchange', handleSelectionChange)
      clearTimeout(timer)
    }
  }, [updateSelection, debounceMs, options.ready, options.containerRef])

  return {
    ...selection,
    updateSelection,
    clearSelection,
  }
}
