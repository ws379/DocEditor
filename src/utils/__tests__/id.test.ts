/**
 * ID 生成工具测试
 */
import { describe, it, expect } from 'vitest'
import { generateId } from '../id'

describe('generateId', () => {
  it('should generate a string id', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('should generate unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })

  it('should add prefix when provided', () => {
    const id = generateId('test')
    expect(id).toMatch(/^test_/)
  })

  it('should not add prefix when not provided', () => {
    const id = generateId()
    expect(id).not.toMatch(/^_/)
  })

  it('should generate ids with consistent length without prefix', () => {
    const id = generateId()
    // Date.now().toString(36) is typically 8-9 chars + random 6 chars
    expect(id.length).toBeGreaterThanOrEqual(10)
    expect(id.length).toBeLessThanOrEqual(20)
  })
})
