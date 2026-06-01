import { describe, it, expect, beforeEach } from 'vitest'
import { useTranslationMemoryStore } from '../translationMemoryStore'

describe('translationMemoryStore', () => {
  beforeEach(() => {
    useTranslationMemoryStore.setState({
      pairs: [],
      matches: [],
      isSearching: false,
    })
  })

  it('has correct initial state', () => {
    const state = useTranslationMemoryStore.getState()
    expect(state.pairs).toEqual([])
    expect(state.matches).toEqual([])
    expect(state.isSearching).toBe(false)
  })

  it('sets isSearching', () => {
    const { setIsSearching } = useTranslationMemoryStore.getState()
    setIsSearching(true)
    expect(useTranslationMemoryStore.getState().isSearching).toBe(true)
  })

  it('sets matches', () => {
    const { setMatches } = useTranslationMemoryStore.getState()
    const mockMatches = [
      { id: '1', source: 'Hello', target: '你好', sourceLang: 'en', targetLang: 'zh', usageCount: 1, createdAt: Date.now(), updatedAt: Date.now() },
    ]
    setMatches(mockMatches)
    expect(useTranslationMemoryStore.getState().matches).toEqual(mockMatches)
  })
})
