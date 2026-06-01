import { API_CONFIG } from '../config/api'

const API_BASE = API_CONFIG.baseUrl

/**
 * Upload an image to the server.
 * Returns the URL of the uploaded image.
 */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE}/upload/image`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(error.error || 'Upload failed')
  }

  const data = await response.json()
  return data.url
}

/**
 * Check if image upload is available.
 */
export async function checkUploadAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`)
    const data = await response.json()
    return data.status === 'ok'
  } catch {
    return false
  }
}
