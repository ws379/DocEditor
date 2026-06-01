import Dexie, { type EntityTable } from 'dexie'
import type { Draft, VersionSnapshot, PanelStateEntry } from '../types/editor.types'

/**
 * Dexie.js database schema for DocEditor.
 * Replaces raw IndexedDB with reactive Live Queries.
 */
export interface BilingualSegment {
  id: number
  source: string
  target: string
  createdAt: number
}

export const db = new Dexie('DocEditorDB') as Dexie & {
  drafts: EntityTable<Draft, 'id'>
  versions: EntityTable<VersionSnapshot, 'id'>
  terms: EntityTable<{ id: string; source: string; target: string; createdAt: number; updatedAt: number }, 'id'>
  bilingualSegments: EntityTable<BilingualSegment, 'id'>
  panelState: EntityTable<PanelStateEntry, 'key'>
}

db.version(1).stores({
  drafts: 'id, updatedAt, title',
  versions: 'id, draftId, createdAt',
  terms: 'id, source, createdAt',
})

// Version 2: adds bilingualSegments table (new table, no migration needed — Dexie auto-creates it)
db.version(2).stores({
  drafts: 'id, updatedAt, title',
  versions: 'id, draftId, createdAt',
  terms: 'id, source, createdAt',
  bilingualSegments: '++id, source, createdAt',
})

// Version 3: adds panelState table for reference panel persistence (PDF, image, code, docx)
db.version(3).stores({
  drafts: 'id, updatedAt, title',
  versions: 'id, draftId, createdAt',
  terms: 'id, source, createdAt',
  bilingualSegments: '++id, source, createdAt',
  panelState: 'key',
})
