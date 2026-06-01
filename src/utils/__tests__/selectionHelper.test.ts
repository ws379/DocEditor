import { describe, it, expect } from 'vitest'
import { smartTrimSelection, refineToWordBoundary, joinSpansWithSpace } from '../selectionHelper'

describe('smartTrimSelection', () => {
  it('returns text unchanged if under maxLength', () => {
    expect(smartTrimSelection('Hello', 200)).toBe('Hello')
  })
})

describe('refineToWordBoundary', () => {
  it('trims leading and trailing punctuation', () => {
    expect(refineToWordBoundary('  Hello world!  ')).toBe('Hello world')
  })
})

describe('joinSpansWithSpace', () => {
  it('joins adjacent spans without space when gap is small', () => {
    const spans = [
      { text: 'Hel', right: 100, left: 50 },
      { text: 'lo', right: 130, left: 102 },
    ]
    expect(joinSpansWithSpace(spans, 12)).toBe('Hello')
  })

  it('inserts space when gap exceeds threshold', () => {
    const spans = [
      { text: 'Hello', right: 100, left: 50 },
      { text: 'world', right: 200, left: 130 },
    ]
    expect(joinSpansWithSpace(spans, 12)).toBe('Hello world')
  })

  it('returns empty string for empty input', () => {
    expect(joinSpansWithSpace([], 12)).toBe('')
  })

  it('returns single span text unchanged', () => {
    const spans = [{ text: 'Hello', right: 100, left: 50 }]
    expect(joinSpansWithSpace(spans, 12)).toBe('Hello')
  })
})
