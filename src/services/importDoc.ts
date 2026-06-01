import { marked } from 'marked'

export interface ImportResult {
  html: string
  title: string
  warnings: string[]
}

/**
 * Import .docx file to HTML using mammoth.js
 */
export async function importDocx(file: File): Promise<ImportResult> {
  const arrayBuffer = await file.arrayBuffer()

  // Validate the file is a proper ZIP (DOCX is a ZIP archive)
  const header = new Uint8Array(arrayBuffer.slice(0, 4))
  const isZip = header[0] === 0x50 && header[1] === 0x4B // PK signature
  if (!isZip) {
    if (arrayBuffer.byteLength === 0) {
      throw new Error('文件为空，请选择有效的文档文件')
    }
    throw new Error('此文件不是有效的 .docx 格式。如果是旧版 .doc 格式，请先用 Word 另存为 .docx 后重试')
  }

  try {
    const mammoth = await import('mammoth')
    const result = await mammoth.default.convertToHtml({ arrayBuffer })

    const warnings: string[] = []
    if (result.messages.length > 0) {
      warnings.push(...result.messages.map((m: any) => m.message))
    }

    if (!result.value || result.value.trim() === '') {
      throw new Error('文档内容为空或无法解析')
    }

    const title = file.name.replace(/\.docx$/i, '')
    return { html: result.value, title, warnings }
  } catch (err: any) {
    if (err.message?.includes('Corrupted zip') || err.message?.includes('End of data')) {
      throw new Error('文件损坏或格式不正确。请确认是有效的 .docx 文件')
    }
    throw err
  }
}

/**
 * Import .txt file to HTML
 */
export async function importTxt(file: File): Promise<ImportResult> {
  const text = await file.text()
  if (!text.trim()) {
    throw new Error('文件内容为空')
  }
  const html = text
    .split(/\r?\n\r?\n/)
    .filter((p) => p.trim())
    .map((p) => `<p>${p.replace(/\r?\n/g, '<br>')}</p>`)
    .join('')

  const title = file.name.replace(/\.txt$/i, '')
  return { html, title, warnings: [] }
}

/**
 * Import .md file to HTML using marked
 */
export async function importMarkdown(file: File): Promise<ImportResult> {
  const text = await file.text()
  if (!text.trim()) {
    throw new Error('文件内容为空')
  }
  const html = await marked.parse(text)

  const title = file.name.replace(/\.md$/i, '')
  return { html, title, warnings: [] }
}

/**
 * Import .html file
 */
export async function importHtml(file: File): Promise<ImportResult> {
  const text = await file.text()
  if (!text.trim()) {
    throw new Error('文件内容为空')
  }

  // Extract body content if it's a full HTML document
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/html')
  const body = doc.body.innerHTML || text

  const titleEl = doc.querySelector('title')
  const title = titleEl?.textContent || file.name.replace(/\.html?$/i, '')

  return { html: body, title, warnings: [] }
}

/**
 * Auto-detect file type and import
 */
export async function importFile(file: File): Promise<ImportResult> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'docx':
      return importDocx(file)
    case 'doc':
      throw new Error('旧版 .doc 格式不支持直接导入。请先用 Word 或 WPS 另存为 .docx 格式后重试')
    case 'txt':
      return importTxt(file)
    case 'md':
    case 'markdown':
      return importMarkdown(file)
    case 'html':
    case 'htm':
      return importHtml(file)
    default:
      throw new Error(`不支持的文件格式: .${ext}。支持: .docx, .txt, .md, .html`)
  }
}

export const SUPPORTED_IMPORT_TYPES = [
  '.docx',
  '.txt',
  '.md',
  '.markdown',
  '.html',
  '.htm',
]

export const SUPPORTED_IMPORT_MIME = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/html',
]
