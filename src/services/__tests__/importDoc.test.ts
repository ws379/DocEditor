/**
 * 文档导入服务测试
 */
import { describe, it, expect, vi } from 'vitest'
import { importTxt, importHtml, importFile, SUPPORTED_IMPORT_TYPES } from '../importDoc'

describe('importDoc', () => {
  describe('importTxt', () => {
    it('should convert plain text to HTML paragraphs', async () => {
      const file = new File(['Hello World\n\nSecond paragraph'], 'test.txt', { type: 'text/plain' })
      const result = await importTxt(file)

      expect(result.title).toBe('test')
      expect(result.html).toContain('<p>')
      expect(result.html).toContain('Hello World')
      expect(result.html).toContain('Second paragraph')
      expect(result.warnings).toEqual([])
    })

    it('should throw error for empty file', async () => {
      const file = new File([''], 'empty.txt', { type: 'text/plain' })
      await expect(importTxt(file)).rejects.toThrow('文件内容为空')
    })

    it('should handle single paragraph', async () => {
      const file = new File(['Single paragraph'], 'test.txt', { type: 'text/plain' })
      const result = await importTxt(file)

      expect(result.html).toBe('<p>Single paragraph</p>')
    })
  })

  describe('importHtml', () => {
    it('should extract body content from HTML', async () => {
      const html = '<html><head><title>Test Title</title></head><body><p>Hello</p></body></html>'
      const file = new File([html], 'test.html', { type: 'text/html' })
      const result = await importHtml(file)

      expect(result.title).toBe('Test Title')
      expect(result.html).toContain('<p>Hello</p>')
    })

    it('should use filename as title when no title tag', async () => {
      const html = '<html><body><p>Content</p></body></html>'
      const file = new File([html], 'my-doc.html', { type: 'text/html' })
      const result = await importHtml(file)

      expect(result.title).toBe('my-doc')
    })

    it('should throw error for empty file', async () => {
      const file = new File([''], 'empty.html', { type: 'text/html' })
      await expect(importHtml(file)).rejects.toThrow('文件内容为空')
    })
  })

  describe('importFile', () => {
    it('should route to correct importer based on extension', async () => {
      const txtFile = new File(['Hello'], 'test.txt', { type: 'text/plain' })
      const result = await importFile(txtFile)

      expect(result.html).toContain('Hello')
    })

    it('should throw error for unsupported format', async () => {
      const file = new File(['data'], 'test.pdf', { type: 'application/pdf' })
      await expect(importFile(file)).rejects.toThrow('不支持的文件格式')
    })

    it('should throw error for .doc format', async () => {
      const file = new File(['data'], 'test.doc', { type: 'application/msword' })
      await expect(importFile(file)).rejects.toThrow('旧版 .doc 格式不支持')
    })
  })

  describe('SUPPORTED_IMPORT_TYPES', () => {
    it('should include common document formats', () => {
      expect(SUPPORTED_IMPORT_TYPES).toContain('.docx')
      expect(SUPPORTED_IMPORT_TYPES).toContain('.txt')
      expect(SUPPORTED_IMPORT_TYPES).toContain('.md')
      expect(SUPPORTED_IMPORT_TYPES).toContain('.html')
    })
  })
})
