import { useState, useCallback, useEffect } from 'react'

export function useFocusMode() {
  const [enabled, setEnabled] = useState(false)

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev
      document.body.classList.toggle('focus-mode', next)
      return next
    })
  }, [])

  // ESC 键退出专注模式（仅在无其他弹窗时触发）
  useEffect(() => {
    if (!enabled) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // 检查是否有其他弹窗/模态框打开
      const hasModal =
        // role="dialog" 元素
        document.querySelector('[role="dialog"]') ||
        // 全屏覆盖层（inset-0 的 fixed 元素）
        document.querySelector('.fixed.inset-0') ||
        // 内联样式的高 z-index 固定定位元素（排除 toast）
        Array.from(document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]'))
          .some(el => {
            if (el.closest('[data-toast]')) return false
            const zIndex = parseInt((el as HTMLElement).style.zIndex || '0', 10)
            return zIndex >= 100
          })
      if (hasModal) return
      e.preventDefault()
      toggle()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, toggle])

  return { enabled, toggle }
}
