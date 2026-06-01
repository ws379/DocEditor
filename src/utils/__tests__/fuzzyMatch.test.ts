import { describe, it, expect } from 'vitest'
import { levenshteinDistance, similarity, fuzzyIncludes } from '../fuzzyMatch'

describe('fuzzyMatch', () => {
  describe('levenshteinDistance', () => {
    it('returns 0 for identical strings', () => {
      expect(levenshteinDistance('hello', 'hello')).toBe(0)
    })

    it('returns string length for empty vs non-empty', () => {
      expect(levenshteinDistance('', 'hello')).toBe(5)
      expect(levenshteinDistance('hello', '')).toBe(5)
    })

    it('returns 1 for single character difference', () => {
      expect(levenshteinDistance('hello', 'hallo')).toBe(1)
    })

    it('calculates correct distance for longer strings', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3)
    })

    it('handles unicode characters', () => {
      expect(levenshteinDistance('你好', '你好')).toBe(0)
      expect(levenshteinDistance('你好', '您好')).toBe(1)
    })
  })

  describe('similarity', () => {
    it('returns 1 for identical strings', () => {
      expect(similarity('hello', 'hello')).toBe(1)
    })

    it('returns 0 for completely different strings', () => {
      expect(similarity('abc', 'xyz')).toBe(0)
    })

    it('returns value between 0 and 1 for similar strings', () => {
      const sim = similarity('hello', 'hallo')
      expect(sim).toBeGreaterThan(0)
      expect(sim).toBeLessThan(1)
    })
  })

  describe('fuzzyIncludes', () => {
    it('returns true for exact match', () => {
      expect(fuzzyIncludes('hello world', 'hello')).toBe(true)
    })

    it('returns true for close match within threshold', () => {
      expect(fuzzyIncludes('helo world', 'hello', 0.6)).toBe(true)
    })

    it('returns false for distant match', () => {
      expect(fuzzyIncludes('xyz abc', 'hello', 0.8)).toBe(false)
    })

    it('uses default threshold of 0.7', () => {
      expect(fuzzyIncludes('helo', 'hello')).toBe(true)
    })
  })
})
