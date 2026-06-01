import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAutoSave } from '../useAutoSave'

// Mock the draft store
const mockSaveCurrentDraft = vi.fn()
const mockHandleNew = vi.fn()
const mockGetState = vi.fn()

vi.mock('../../stores/draftStore', () => ({
  useDraftStore: {
    getState: () => mockGetState(),
  },
}))

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockSaveCurrentDraft.mockReset()
    mockHandleNew.mockReset()
    mockGetState.mockReturnValue({
      current: { id: 'draft-1', content: '', title: 'Test', version: 1, updatedAt: Date.now() },
      handleNew: mockHandleNew,
      saveCurrentDraft: mockSaveCurrentDraft,
    })
    mockSaveCurrentDraft.mockResolvedValue(undefined)
    mockHandleNew.mockResolvedValue({ id: 'new-draft', content: '', title: 'Untitled', version: 1, updatedAt: Date.now() })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns markDirty and saveNow functions', () => {
    const { result } = renderHook(() => useAutoSave(() => '<p>hello</p>'))
    expect(typeof result.current.markDirty).toBe('function')
    expect(typeof result.current.saveNow).toBe('function')
  })

  it('does not save immediately on markDirty', () => {
    const { result } = renderHook(() => useAutoSave(() => '<p>hello</p>'))
    act(() => { result.current.markDirty() })
    expect(mockSaveCurrentDraft).not.toHaveBeenCalled()
  })

  it('saves after debounce delay (3s)', async () => {
    const getContent = vi.fn().mockReturnValue('<p>edited</p>')
    const { result } = renderHook(() => useAutoSave(getContent))

    act(() => { result.current.markDirty() })

    // Not saved yet at 2.9s
    act(() => { vi.advanceTimersByTime(2900) })
    expect(mockSaveCurrentDraft).not.toHaveBeenCalled()

    // Saved at 3s
    await act(async () => { vi.advanceTimersByTime(200) })
    expect(mockSaveCurrentDraft).toHaveBeenCalledWith('<p>edited</p>')
  })

  it('resets debounce timer on repeated markDirty calls', async () => {
    const getContent = vi.fn().mockReturnValue('<p>final</p>')
    const { result } = renderHook(() => useAutoSave(getContent))

    act(() => { result.current.markDirty() })
    act(() => { vi.advanceTimersByTime(2000) })
    act(() => { result.current.markDirty() }) // reset timer
    act(() => { vi.advanceTimersByTime(2000) }) // only 2s since reset
    expect(mockSaveCurrentDraft).not.toHaveBeenCalled()

    await act(async () => { vi.advanceTimersByTime(1000) }) // 3s since reset
    expect(mockSaveCurrentDraft).toHaveBeenCalledWith('<p>final</p>')
  })

  it('saveNow cancels pending debounce and saves immediately', async () => {
    const getContent = vi.fn().mockReturnValue('<p>immediate</p>')
    const { result } = renderHook(() => useAutoSave(getContent))

    act(() => { result.current.markDirty() })
    act(() => { vi.advanceTimersByTime(1000) }) // partial debounce

    await act(async () => { await result.current.saveNow() })
    expect(mockSaveCurrentDraft).toHaveBeenCalledWith('<p>immediate</p>')
  })

  it('does not save empty content', async () => {
    const getContent = vi.fn().mockReturnValue('<p></p>')
    const { result } = renderHook(() => useAutoSave(getContent))

    act(() => { result.current.markDirty() })
    await act(async () => { vi.advanceTimersByTime(3100) })
    expect(mockSaveCurrentDraft).not.toHaveBeenCalled()
  })

  it('auto-creates draft if none exists', async () => {
    mockGetState.mockReturnValue({
      current: null,
      handleNew: mockHandleNew,
      saveCurrentDraft: mockSaveCurrentDraft,
    })
    mockHandleNew.mockResolvedValue({ id: 'auto-created', content: '', title: 'Untitled', version: 1, updatedAt: Date.now() })

    const getContent = vi.fn().mockReturnValue('<p>first edit</p>')
    const { result } = renderHook(() => useAutoSave(getContent))

    act(() => { result.current.markDirty() })
    await act(async () => { vi.advanceTimersByTime(3100) })

    expect(mockHandleNew).toHaveBeenCalled()
    expect(mockSaveCurrentDraft).toHaveBeenCalledWith('<p>first edit</p>')
  })

  it('re-triggers save if edits arrived during ongoing save', async () => {
    let resolveFirstSave: () => void
    const firstSavePromise = new Promise<void>(resolve => { resolveFirstSave = resolve })
    mockSaveCurrentDraft.mockImplementationOnce(() => firstSavePromise)

    const getContent = vi.fn()
      .mockReturnValueOnce('<p>first</p>')   // first save
      .mockReturnValueOnce('<p>second</p>')  // re-trigger save

    const { result } = renderHook(() => useAutoSave(getContent))

    // Trigger first save
    act(() => { result.current.markDirty() })
    await act(async () => { vi.advanceTimersByTime(3100) })

    // While first save is pending, mark dirty again
    act(() => { result.current.markDirty() })

    // Complete first save
    await act(async () => { resolveFirstSave!() })

    // Wait for re-triggered save
    await act(async () => { vi.advanceTimersByTime(3100) })
    expect(mockSaveCurrentDraft).toHaveBeenCalledTimes(2)
  })
})
