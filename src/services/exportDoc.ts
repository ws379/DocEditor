import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, ShadingType, LevelFormat } from 'docx'
import TurndownService from 'turndown'

// ── helpers ────────────────────────────────────────────────────────
function parsePx(val: string | null): number {
  if (!val) return 0
  const m = val.match(/([\d.]+)/)
  return m ? parseFloat(m[1]) : 0
}

function colorToHex(c: string): string | undefined {
  if (!c || c === 'rgb(0, 0, 0)' || c === 'black') return undefined
  const m = c.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (m) return `${(+m[1]).toString(16).padStart(2,'0')}${(+m[2]).toString(16).padStart(2,'0')}${(+m[3]).toString(16).padStart(2,'0')}`
  if (c.startsWith('#')) return c.slice(1)
  return undefined
}

const TAG_TO_HEADING: Record<string, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
  h1: HeadingLevel.HEADING_1,
  h2: HeadingLevel.HEADING_2,
  h3: HeadingLevel.HEADING_3,
  h4: HeadingLevel.HEADING_4,
  h5: HeadingLevel.HEADING_5,
  h6: HeadingLevel.HEADING_6,
}

// ── DOCX export (rich formatting) ─────────────────────────────────

function buildRuns(el: HTMLElement): TextRun[] {
  const runs: TextRun[] = []
  el.childNodes.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || ''
      if (text) runs.push(new TextRun({ text, size: 24, font: 'Microsoft YaHei' }))
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const ce = child as HTMLElement
      const tag = ce.tagName.toLowerCase()
      const style = ce.style
      const opts: any = {
        text: ce.textContent || '',
        size: parsePx(style.fontSize) ? Math.round(parsePx(style.fontSize) * 2) : 24,
        font: style.fontFamily?.replace(/['"]/g, '') || 'Microsoft YaHei',
        bold: tag === 'strong' || tag === 'b' || parsePx(style.fontWeight) >= 700,
        italics: tag === 'em' || tag === 'i' || style.fontStyle === 'italic',
        underline: tag === 'u' || style.textDecoration?.includes('underline') ? {} : undefined,
        strike: tag === 's' || tag === 'del' || tag === 'strike' || style.textDecoration?.includes('line-through'),
        color: colorToHex(style.color),
        shading: style.backgroundColor && style.backgroundColor !== 'transparent'
          ? { type: ShadingType.CLEAR, fill: colorToHex(style.backgroundColor) || 'FFFFFF' }
          : undefined,
      }
      // nested inline elements (e.g. bold+italic inside a span)
      if (ce.children.length > 0 && ['span','font','a'].includes(tag)) {
        const nested = buildRuns(ce)
        if (nested.length > 0) { runs.push(...nested); return }
      }
      if (tag === 'sub') { opts.subScript = true }
      if (tag === 'sup') { opts.superScript = true }
      runs.push(new TextRun(opts))
    }
  })
  return runs
}

function htmlToDocxParagraphs(root: HTMLElement): Paragraph[] {
  const result: Paragraph[] = []

  root.childNodes.forEach(node => {
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()
    const style = el.style

    // ── headings ──
    if (TAG_TO_HEADING[tag]) {
      result.push(new Paragraph({
        heading: TAG_TO_HEADING[tag],
        alignment: style.textAlign === 'center' ? AlignmentType.CENTER
          : style.textAlign === 'right' ? AlignmentType.RIGHT
          : style.textAlign === 'justify' ? AlignmentType.JUSTIFIED : undefined,
        children: [new TextRun({
          text: el.textContent || '',
          bold: true,
          font: 'Microsoft YaHei',
          size: tag === 'h1' ? 36 : tag === 'h2' ? 32 : tag === 'h3' ? 28 : 24,
        })],
      }))
      return
    }

    // ── paragraph ──
    if (tag === 'p' || tag === 'div') {
      const runs = buildRuns(el)
      const alignment = style.textAlign === 'center' ? AlignmentType.CENTER
        : style.textAlign === 'right' ? AlignmentType.RIGHT
        : style.textAlign === 'justify' ? AlignmentType.JUSTIFIED : undefined
      const lineHeight = style.lineHeight ? Math.round(parseFloat(style.lineHeight) * 240) : undefined
      result.push(new Paragraph({
        alignment,
        spacing: lineHeight ? { line: lineHeight } : undefined,
        indent: style.textIndent ? { firstLine: Math.round(parsePx(style.textIndent) * 15) } : undefined,
        children: runs.length > 0 ? runs : [new TextRun({ text: '', size: 24 })],
      }))
      return
    }

    // ── lists ──
    if (tag === 'ul') {
      el.querySelectorAll(':scope > li').forEach(li => {
        result.push(new Paragraph({
          numbering: { reference: 'bullet', level: 0 },
          children: buildRuns(li as HTMLElement),
        }))
      })
      return
    }
    if (tag === 'ol') {
      const start = el.getAttribute('start') ? parseInt(el.getAttribute('start')!) : undefined
      el.querySelectorAll(':scope > li').forEach(li => {
        result.push(new Paragraph({
          numbering: { reference: 'ordered', level: 0 },
          children: buildRuns(li as HTMLElement),
        }))
      })
      return
    }

    // ── blockquote ──
    if (tag === 'blockquote') {
      result.push(new Paragraph({
        indent: { left: 720 },
        border: { left: { style: BorderStyle.SINGLE, size: 6, color: '3B82F6', space: 8 } },
        children: [new TextRun({ text: el.textContent || '', italics: true, size: 24, font: 'Microsoft YaHei', color: '6B7280' })],
      }))
      return
    }

    // ── code block ──
    if (tag === 'pre' || tag === 'code') {
      const lines = (el.textContent || '').split('\n')
      lines.forEach(line => {
        result.push(new Paragraph({
          shading: { type: ShadingType.CLEAR, fill: 'F3F4F6' },
          children: [new TextRun({ text: line || ' ', font: 'Courier New', size: 20 })],
        }))
      })
      return
    }

    // ── table ──
    if (tag === 'table') {
      const rows = el.querySelectorAll('tr')
      rows.forEach(tr => {
        const cells = tr.querySelectorAll('td, th')
        const paras: Paragraph[] = []
        cells.forEach(cell => {
          const isHeader = cell.tagName.toLowerCase() === 'th'
          paras.push(new Paragraph({
            shading: isHeader ? { type: ShadingType.CLEAR, fill: 'E5E7EB' } : undefined,
            children: [new TextRun({ text: cell.textContent || '', bold: isHeader, size: 22, font: 'Microsoft YaHei' })],
          }))
        })
        result.push(...paras)
      })
      return
    }

    // ── image ──
    if (tag === 'img') {
      const src = el.getAttribute('src')
      if (src) {
        result.push(new Paragraph({
          children: [new TextRun({ text: `[图片: ${src}]`, italics: true, color: '6B7280', size: 20 })],
        }))
      }
      return
    }

    // ── hr ──
    if (tag === 'hr') {
      result.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' } },
        children: [new TextRun({ text: '' })],
      }))
      return
    }

    // ── fallback: recurse ──
    result.push(...htmlToDocxParagraphs(el))
  })

  return result
}

export async function exportToDocx(html: string, title: string): Promise<Blob> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const paragraphs = htmlToDocxParagraphs(doc.body)

  const docxDoc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Microsoft YaHei', size: 24 } },
      },
    },
    numbering: {
      config: [
        {
          reference: 'ordered',
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
        {
          reference: 'bullet',
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
      ],
    },
    sections: [{
      properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children: paragraphs.length > 0 ? paragraphs : [new Paragraph({ children: [] })],
    }],
  })

  return Packer.toBlob(docxDoc)
}

// ── PDF export (html2canvas → image → jsPDF) ──────────────────────

export async function exportToPdf(html: string, title: string): Promise<void> {
  // Create an overlay container (positioned in viewport so html2canvas can see it)
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed; left: 0; top: 0; width: 100vw; height: 100vh;
    z-index: 99999; background: white; overflow: auto; opacity: 0.01; pointer-events: none;
  `
  const inner = document.createElement('div')
  inner.style.cssText = `
    width: 794px; margin: 0 auto; padding: 40px 56px;
    font-family: "Microsoft YaHei", "SimSun", "SimSun", "PingFang SC", "Noto Sans SC", -apple-system, sans-serif;
    font-size: 14px; line-height: 1.8; color: #1a1a1a; background: white;
  `
  inner.innerHTML = html

  // Add scoped styles
  const styleEl = document.createElement('style')
  styleEl.textContent = `
    h1 { font-size: 28px; font-weight: 700; margin: 20px 0 10px; color: #111; }
    h2 { font-size: 22px; font-weight: 600; margin: 18px 0 8px; color: #222; }
    h3 { font-size: 18px; font-weight: 600; margin: 14px 0 6px; color: #333; }
    h4,h5,h6 { font-size: 16px; font-weight: 600; margin: 10px 0 4px; }
    p { margin: 8px 0; }
    ul, ol { padding-left: 24px; margin: 8px 0; }
    li { margin: 4px 0; }
    blockquote { border-left: 4px solid #3b82f6; padding: 8px 16px; margin: 10px 0; background: #f8fafc; color: #4b5563; font-style: italic; }
    pre { background: #1f2937; color: #e5e7eb; padding: 12px; border-radius: 6px; }
    code { font-family: "Courier New", monospace; font-size: 13px; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; }
    th, td { border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; }
    th { background: #f3f4f6; font-weight: 600; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 12px 0; }
    img { max-width: 100%; height: auto; }
  `
  inner.prepend(styleEl)
  overlay.appendChild(inner)
  document.body.appendChild(overlay)

  try {
    const html2pdf = (await import('html2pdf.js')).default
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: `${title || '文档'}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false, letterRendering: true, windowWidth: 794 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      } as any)
      .from(inner)
      .save()
  } finally {
    document.body.removeChild(overlay)
  }
}

// ── Markdown export ────────────────────────────────────────────────

export async function exportToMarkdown(html: string): Promise<string> {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  })

  turndown.addRule('codeBlock', {
    filter: ['pre'],
    replacement: (_content, node) => {
      const el = node as HTMLElement
      const code = el.querySelector('code')
      const text = code?.textContent || el.textContent || ''
      return `\n\`\`\`\n${text}\n\`\`\`\n`
    },
  })

  turndown.addRule('strikethrough', {
    filter: ['del', 's'],
    replacement: (_content, node) => `~~${(node as HTMLElement).textContent}~~`,
  })

  return turndown.turndown(html)
}

// ── HTML export ────────────────────────────────────────────────────

export async function exportToHtml(html: string, title: string): Promise<string> {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: "Microsoft YaHei", "PingFang SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 800px; margin: 0 auto; padding: 40px 20px;
      line-height: 1.8; color: #1a1a1a;
    }
    h1 { font-size: 2em; font-weight: 700; margin: 1.5em 0 0.5em; }
    h2 { font-size: 1.5em; font-weight: 600; margin: 1.3em 0 0.4em; }
    h3 { font-size: 1.25em; font-weight: 600; margin: 1.2em 0 0.3em; }
    h4, h5, h6 { font-size: 1.1em; font-weight: 600; margin: 1em 0 0.3em; }
    p { margin: 0.8em 0; }
    ul, ol { padding-left: 1.5em; margin: 0.5em 0; }
    li { margin: 0.2em 0; }
    blockquote { border-left: 4px solid #3b82f6; margin: 1em 0; padding: 0.5em 1em; background: #f8fafc; color: #4b5563; font-style: italic; border-radius: 0 4px 4px 0; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: "Courier New", monospace; font-size: 0.9em; }
    pre { background: #1f2937; color: #e5e7eb; padding: 16px; border-radius: 8px; overflow-x: auto; }
    pre code { background: none; color: inherit; padding: 0; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
    th { background: #f3f4f6; font-weight: 600; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5em 0; }
    img { max-width: 100%; height: auto; border-radius: 4px; }
    a { color: #2563eb; text-decoration: underline; }
    mark { background: #fef08a; padding: 0 2px; }
  </style>
</head>
<body>
${html}
</body>
</html>`
}

// ── Download helpers ───────────────────────────────────────────────

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadString(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  downloadBlob(blob, filename)
}

export type ExportFormat = 'pdf' | 'docx' | 'md' | 'html'
