import { PDFDocument } from 'pdf-lib'

export interface PdfInfo {
  file: File
  name: string
  pageCount: number
  size: number
}

function validatePdfBuffer(arrayBuffer: ArrayBuffer, fileName: string): void {
  if (arrayBuffer.byteLength === 0) {
    throw new Error(`"${fileName}" 文件为空`)
  }
  const header = new Uint8Array(arrayBuffer.slice(0, 5))
  const isPdf = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46
  if (!isPdf) {
    throw new Error(`"${fileName}" 不是有效的 PDF 文件`)
  }
}

/**
 * Get PDF info without loading full content
 */
export async function getPdfInfo(file: File): Promise<PdfInfo> {
  const arrayBuffer = await file.arrayBuffer()
  validatePdfBuffer(arrayBuffer, file.name)
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })

  return {
    file,
    name: file.name,
    pageCount: pdfDoc.getPageCount(),
    size: file.size,
  }
}

/**
 * Merge multiple PDF files into one
 */
export async function mergePdfs(files: File[]): Promise<Blob> {
  const mergedPdf = await PDFDocument.create()

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer()
    validatePdfBuffer(arrayBuffer, file.name)
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
    const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())

    for (const page of pages) {
      mergedPdf.addPage(page)
    }
  }

  const mergedBytes = await mergedPdf.save()
  return new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' })
}

/**
 * Merge PDFs with page selection
 */
export async function mergePdfsSelection(
  selections: Array<{ file: File; pages: number[] }>
): Promise<Blob> {
  const mergedPdf = await PDFDocument.create()

  for (const { file, pages } of selections) {
    const arrayBuffer = await file.arrayBuffer()
    validatePdfBuffer(arrayBuffer, file.name)
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })

    // Convert 1-based page indices to 0-based
    const zeroBasedPages = pages.map((p) => p - 1).filter((p) => p >= 0 && p < pdfDoc.getPageCount())
    const copiedPages = await mergedPdf.copyPages(pdfDoc, zeroBasedPages)

    for (const page of copiedPages) {
      mergedPdf.addPage(page)
    }
  }

  const mergedBytes = await mergedPdf.save()
  return new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' })
}

/**
 * Download merged PDF
 */
export function downloadPdf(blob: Blob, filename: string = 'merged.pdf'): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
