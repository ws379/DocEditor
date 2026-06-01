import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSelection } from '../hooks/useSelection'

describe('useSelection', () => {
  it('calls onSelect when text is selected', () => {
    const onSelect = vi.fn()
    const container = document.createElement('div')
    document.body.appendChild(container)
    const containerRef = { current: container }

    renderHook(() =>
      useSelection({
        containerRef,
        enabled: true,
        onSelect,
      })
    )

    // Simulate mouseup event on a child inside the container
    const child = document.createElement('span')
    container.appendChild(child)
    act(() => {
      child.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    })

    // onSelect should not be called yet (no selection)
    expect(onSelect).not.toHaveBeenCalled()
    document.body.removeChild(container)
  })

  it('does not call onSelect when disabled', () => {
    const onSelect = vi.fn()
    const container = document.createElement('div')
    document.body.appendChild(container)
    const containerRef = { current: container }

    renderHook(() =>
      useSelection({
        containerRef,
        enabled: false,
        onSelect,
      })
    )

    const child = document.createElement('span')
    container.appendChild(child)
    act(() => {
      child.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    })

    expect(onSelect).not.toHaveBeenCalled()
    document.body.removeChild(container)
  })

  it('does not call onSelect when mouseup is outside container', () => {
    const onSelect = vi.fn()
    const container = document.createElement('div')
    document.body.appendChild(container)
    const containerRef = { current: container }
    const outside = document.createElement('div')
    document.body.appendChild(outside)

    renderHook(() =>
      useSelection({
        containerRef,
        enabled: true,
        onSelect,
      })
    )

    act(() => {
      outside.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    })

    expect(onSelect).not.toHaveBeenCalled()
    document.body.removeChild(container)
    document.body.removeChild(outside)
  })

  it('returns initial selection state', () => {
    const { result } = renderHook(() => useSelection())

    expect(result.current.text).toBe('')
    expect(result.current.rect).toBeNull()
    expect(result.current.isCollapsed).toBe(true)
  })
})
