import { describe, it, expect } from 'vitest'
import { findTermRanges } from '../extensions/TermHighlight'

describe('TermHighlight', () => {
  it('finds single term in text', () => {
    const text = 'Hello World'
    const terms = [{ id: '1', source: 'Hello', target: '你好', createdAt: Date.now(), updatedAt: Date.now() }]
    const ranges = findTermRanges(text, terms)
    expect(ranges).toHaveLength(1)
    expect(ranges[0].from).toBe(0)
    expect(ranges[0].to).toBe(5)
  })

  it('finds multiple terms in text', () => {
    const text = 'Hello World'
    const terms = [
      { id: '1', source: 'Hello', target: '你好', createdAt: Date.now(), updatedAt: Date.now() },
      { id: '2', source: 'World', target: '世界', createdAt: Date.now(), updatedAt: Date.now() },
    ]
    const ranges = findTermRanges(text, terms)
    expect(ranges).toHaveLength(2)
  })

  it('handles overlapping terms (longest first)', () => {
    const text = 'Hello World Hello'
    const terms = [{ id: '1', source: 'Hello', target: '你好', createdAt: Date.now(), updatedAt: Date.now() }]
    const ranges = findTermRanges(text, terms)
    expect(ranges).toHaveLength(2)
  })

  it('returns empty for no match', () => {
    const text = 'No match here'
    const terms = [{ id: '1', source: 'XYZ', target: '测试', createdAt: Date.now(), updatedAt: Date.now() }]
    const ranges = findTermRanges(text, terms)
    expect(ranges).toHaveLength(0)
  })

  it('is case insensitive', () => {
    const text = 'HELLO world'
    const terms = [{ id: '1', source: 'hello', target: '你好', createdAt: Date.now(), updatedAt: Date.now() }]
    const ranges = findTermRanges(text, terms)
    expect(ranges).toHaveLength(1)
  })
})
