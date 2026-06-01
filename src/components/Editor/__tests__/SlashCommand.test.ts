import { describe, it, expect } from 'vitest'
import { getSuggestionItems } from '../extensions/SlashCommand'

describe('SlashCommand', () => {
  it('returns all commands when query is empty', () => {
    const items = getSuggestionItems({ query: '' })
    expect(items.length).toBeGreaterThan(0)
  })

  it('filters commands by query', () => {
    const items = getSuggestionItems({ query: '表' })
    expect(items.some((item) => item.title.includes('表'))).toBe(true)
  })

  it('filters commands by description', () => {
    const items = getSuggestionItems({ query: '标题' })
    expect(items.some((item) => item.description.includes('标题'))).toBe(true)
  })

  it('returns empty array for no match', () => {
    const items = getSuggestionItems({ query: 'xyznonexistent' })
    expect(items).toHaveLength(0)
  })
})
