import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDraftStore } from '../draftStore'

// Mock storage module
vi.mock('../../utils/storage', () => ({
  getAllDrafts: vi.fn().mockResolvedValue([]),
  getDraft: vi.fn().mockResolvedValue(null),
  createDraft: vi.fn().mockImplementation(async (title = '未命名文档') => ({
    id: 'test-id',
    title,
    content: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
  })),
  saveDraft: vi.fn().mockResolvedValue(undefined),
  deleteDraft: vi.fn().mockResolvedValue(undefined),
  saveVersion: vi.fn().mockResolvedValue(undefined),
}))

describe('draftStore', () => {
  beforeEach(() => {
    useDraftStore.setState({
      drafts: [],
      current: null,
    })
    vi.clearAllMocks()
  })

  it('has correct initial state', () => {
    const state = useDraftStore.getState()
    expect(state.drafts).toEqual([])
    expect(state.current).toBeNull()
  })

  it('creates a new draft', async () => {
    const { handleNew } = useDraftStore.getState()
    const draft = await handleNew()
    expect(draft).toBeDefined()
    expect(draft?.title).toBe('未命名文档')
    expect(useDraftStore.getState().current).toBe(draft)
    expect(useDraftStore.getState().drafts).toContain(draft)
  })

  it('sets current draft', () => {
    const { setCurrent } = useDraftStore.getState()
    const draft = { id: '1', title: 'Test', content: '', createdAt: Date.now(), updatedAt: Date.now(), version: 1 }
    setCurrent(draft)
    expect(useDraftStore.getState().current).toBe(draft)
  })
})
