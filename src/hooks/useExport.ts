/**
 * 导出功能 Hook
 */
import { useCallback } from 'react'
import type { Draft } from '../types/editor.types'
import { exportToDocx, exportToPdf, exportToHtml, exportToMarkdown, downloadBlob, downloadString } from '../services/exportDoc'
import { exportToPdfServer, checkPdfServerAvailable } from '../services/exportDocServer'

interface UseExportOptions {
  current: Draft | null
  getContent: () => string
}

export function useExport({ current, getContent }: UseExportOptions) {
  const handleExportHtml = useCallback(async () => {
    const html = getContent()
    const title = current?.title || '文档'
    const fullHtml = await exportToHtml(html, title)
    downloadString(fullHtml, `${title}.html`, 'text/html')
  }, [current, getContent])

  const handleExportDocx = useCallback(async () => {
    const html = getContent()
    const title = current?.title || '文档'
    const blob = await exportToDocx(html, title)
    downloadBlob(blob, `${title}.docx`)
  }, [current, getContent])

  const handleExportPdf = useCallback(async () => {
    const html = getContent()
    const title = current?.title || '文档'

    // Try server-side PDF first (vector PDF with selectable text)
    const serverAvailable = await checkPdfServerAvailable()
    if (serverAvailable) {
      try {
        const blob = await exportToPdfServer(html, title)
        downloadBlob(blob, `${title}.pdf`)
        return
      } catch (err) {
        console.warn('Server PDF failed, falling back to client:', err)
      }
    }

    // Fallback to client-side PDF (screenshot-based)
    await exportToPdf(html, title)
  }, [current, getContent])

  const handleExportMd = useCallback(async () => {
    const html = getContent()
    const title = current?.title || '文档'
    const md = await exportToMarkdown(html)
    downloadString(md, `${title}.md`, 'text/markdown')
  }, [current, getContent])

  return {
    handleExportHtml,
    handleExportDocx,
    handleExportPdf,
    handleExportMd,
  }
}
