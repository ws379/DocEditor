import { API_CONFIG } from '../config/api'

const API_BASE = API_CONFIG.baseUrl

/**
 * Export HTML to PDF using server-side Playwright renderer.
 * Produces true vector PDF with selectable text and proper Chinese font support.
 */
export async function exportToPdfServer(html: string, title: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}/export/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, title }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'PDF generation failed' }))
    throw new Error(error.error || 'PDF generation failed')
  }

  return response.blob()
}

/**
 * Check if server-side PDF generation is available.
 */
export async function checkPdfServerAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`)
    const data = await response.json()
    return data.status === 'ok'
  } catch {
    return false
  }
}
