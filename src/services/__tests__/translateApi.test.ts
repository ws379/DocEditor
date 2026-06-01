/**
 * 翻译 API 服务测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { translateText, getEngines, healthCheck } from '../translateApi'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('translateApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('translateText', () => {
    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          translatedText: '你好',
          engine: 'deepseek',
          sourceLang: 'en',
          targetLang: 'zh',
        }),
      })

      const result = await translateText({
        text: 'hello',
        sourceLang: 'en',
        targetLang: 'zh',
        engine: 'deepseek',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/translate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(result.success).toBe(true)
      expect(result.translatedText).toBe('你好')
    })

    it('should handle API errors', async () => {
      // Use status 400 to skip retry (4xx client errors are not retried)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Translation failed' }),
      })

      const result = await translateText({ text: 'hello' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Translation failed')
    })

    it('should handle network errors', async () => {
      // Mock all 3 retry attempts to reject (retry logic has MAX_RETRIES=3)
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))

      const result = await translateText({ text: 'hello' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('should use default values when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, translatedText: 'test' }),
      })

      await translateText({ text: 'hello' })

      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body.sourceLang).toBe('auto')
      expect(body.targetLang).toBe('zh')
      expect(body.engine).toBe('default')
    })
  })

  describe('getEngines', () => {
    it('should fetch engines from API', async () => {
      const mockEngines = [
        { name: 'deepseek', label: 'DeepSeek', available: true },
        { name: 'tencent', label: '腾讯翻译', available: false },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ engines: mockEngines }),
      })

      const engines = await getEngines()
      expect(engines).toEqual(mockEngines)
    })
  })

  describe('healthCheck', () => {
    it('should return true when API is healthy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      })

      const result = await healthCheck()
      expect(result).toBe(true)
    })

    it('should return false when API is unhealthy', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await healthCheck()
      expect(result).toBe(false)
    })
  })
})
