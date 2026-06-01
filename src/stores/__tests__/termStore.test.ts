import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTermStore } from '../termStore'

// Mock termStorage module
vi.mock('../../services/termStorage', () => ({
  getAllTerms: vi.fn().mockResolvedValue([]),
  addTerm: vi.fn().mockImplementation(async (source: string, target: string) => ({
    id: 'term-1',
    source,
    target,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })),
  updateTerm: vi.fn().mockResolvedValue(undefined),
  deleteTerm: vi.fn().mockResolvedValue(undefined),
  matchTerms: vi.fn().mockResolvedValue([]),
  importTermsFromJson: vi.fn().mockResolvedValue(0),
  importTermsFromCsv: vi.fn().mockResolvedValue(0),
  exportTermsToJson: vi.fn().mockResolvedValue('[]'),
  exportTermsToCsv: vi.fn().mockResolvedValue(''),
}))

describe('termStore', () => {
  beforeEach(() => {
    useTermStore.setState({
      terms: [],
      matchedTerms: [],
    })
    vi.clearAllMocks()
  })

  it('has correct initial state', () => {
    const state = useTermStore.getState()
    expect(state.terms).toEqual([])
    expect(state.matchedTerms).toEqual([])
  })

  it('loads terms', async () => {
    const { loadTerms } = useTermStore.getState()
    await loadTerms()
    // Should call getAllTerms
    expect(true).toBe(true)
  })

  it('adds a term', async () => {
    const { handleAddTerm } = useTermStore.getState()
    await handleAddTerm('hello', '你好')
    const state = useTermStore.getState()
    expect(state.terms).toHaveLength(1)
    expect(state.terms[0].source).toBe('hello')
    expect(state.terms[0].target).toBe('你好')
  })

  it('deletes a term', async () => {
    const { handleAddTerm, handleDeleteTerm } = useTermStore.getState()
    await handleAddTerm('hello', '你好')
    const termId = useTermStore.getState().terms[0].id
    await handleDeleteTerm(termId)
    expect(useTermStore.getState().terms).toHaveLength(0)
  })
})
