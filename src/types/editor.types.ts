export interface Draft {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
  version: number
}

export interface VersionSnapshot {
  id: string
  draftId: string
  content: string
  createdAt: number
  label: string
}

/** Reference panel persisted state — one row per viewer tab */
export interface PanelStateEntry {
  /** Primary key: 'pdf' | 'image' | 'code' | 'docx' */
  key: string
  /** Raw file data (ArrayBuffer for pdf, dataURL for image, text for code/docx) */
  data: ArrayBuffer | string
  /** Original file name */
  fileName: string
  /** MIME type hint */
  mimeType?: string
  /** Last updated timestamp */
  updatedAt: number
}
