import { db } from './db'
import { generateId } from './id'
import type { Draft, VersionSnapshot, PanelStateEntry } from '../types/editor.types'

/**
 * Draft operations using Dexie.js
 */
export async function getAllDrafts(): Promise<Draft[]> {
  return db.drafts.orderBy('updatedAt').reverse().toArray()
}

export async function getDraft(id: string): Promise<Draft | null> {
  const draft = await db.drafts.get(id)
  return draft ?? null
}

export async function saveDraft(draft: Draft): Promise<void> {
  await db.drafts.put({ ...draft, updatedAt: Date.now() })
}

export async function deleteDraft(id: string): Promise<void> {
  await db.drafts.delete(id)
  await db.versions.where('draftId').equals(id).delete()
}

export async function createDraft(title = '未命名文档'): Promise<Draft> {
  const draft: Draft = {
    id: generateId(),
    title,
    content: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
  }
  await db.drafts.put(draft)
  return draft
}

/**
 * Version snapshot operations using Dexie.js
 */
export async function saveVersion(snapshot: VersionSnapshot): Promise<void> {
  await db.versions.put(snapshot)
}

/**
 * Panel state operations — persist reference panel files (PDF, image, code, docx) across sessions.
 */
export async function getPanelState(key: string): Promise<PanelStateEntry | null> {
  const entry = await db.panelState.get(key)
  return entry ?? null
}

export async function savePanelState(entry: PanelStateEntry): Promise<void> {
  await db.panelState.put(entry)
}

export async function deletePanelState(key: string): Promise<void> {
  await db.panelState.delete(key)
}
