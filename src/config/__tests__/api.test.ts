/**
 * API 配置测试
 */
import { describe, it, expect, vi } from 'vitest'
import { API_CONFIG } from '../api'

describe('API_CONFIG', () => {
  it('should have baseUrl property', () => {
    expect(API_CONFIG).toHaveProperty('baseUrl')
    expect(typeof API_CONFIG.baseUrl).toBe('string')
  })

  it('should have timeout property', () => {
    expect(API_CONFIG).toHaveProperty('timeout')
    expect(typeof API_CONFIG.timeout).toBe('number')
    expect(API_CONFIG.timeout).toBeGreaterThan(0)
  })

  it('should use default localhost URL when env not set', () => {
    expect(API_CONFIG.baseUrl).toBe('http://localhost:5000/api')
  })

  it('should have timeout of 30 seconds', () => {
    expect(API_CONFIG.timeout).toBe(30000)
  })
})
