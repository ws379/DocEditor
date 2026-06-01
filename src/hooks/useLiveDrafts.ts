import { useState, useEffect, useCallback } from 'react'
import { db } from '../utils/db'
import type { Draft } from '../types/editor.types'

// ── Refresh bus ────────────────────────────────────────────────────
const _listeners = new Set<() => void>()

/** Call after any draft/term/version DB write to notify reactive hooks */
export function notifyDBChanged() {
  _listeners.forEach(fn => fn())
}

// ── Shared cache for instant first render ──────────────────────────
let _cachedDrafts: Draft[] = []

/** Pre-populate the drafts cache (call from loadAllDrafts) */
export function primeDraftsCache(drafts: Draft[]) {
  _cachedDrafts = drafts
}

// ── useLiveDrafts ──────────────────────────────────────────────────
export function useLiveDrafts(): Draft[] {
  const [drafts, setDrafts] = useState<Draft[]>(_cachedDrafts)

  const fetch = useCallback(async () => {
    const list = await db.drafts.orderBy('updatedAt').reverse().toArray()
    _cachedDrafts = list
    setDrafts(list)
  }, [])

  useEffect(() => {
    fetch()
    _listeners.add(fetch)
    return () => { _listeners.delete(fetch) }
  }, [fetch])

  return drafts
}

// ── useLiveDraft ───────────────────────────────────────────────────
export function useLiveDraft(id: string | null) {
  const [draft, setDraft] = useState<Draft | null>(null)

  const fetch = useCallback(async () => {
    if (id) {
      const d = await db.drafts.get(id)
      setDraft(d ?? null)
    } else {
      setDraft(null)
    }
  }, [id])

  useEffect(() => {
    fetch()
    _listeners.add(fetch)
    return () => { _listeners.delete(fetch) }
  }, [fetch])

  return draft
}

// ── useLiveVersions ────────────────────────────────────────────────
export function useLiveVersions(draftId: string | null) {
  const [versions, setVersions] = useState<any[]>([])

  const fetch = useCallback(async () => {
    if (draftId) {
      const list = await db.versions.where('draftId').equals(draftId).reverse().sortBy('createdAt')
      setVersions(list)
    } else {
      setVersions([])
    }
  }, [draftId])

  useEffect(() => {
    fetch()
    _listeners.add(fetch)
    return () => { _listeners.delete(fetch) }
  }, [fetch])

  return versions
}

// ── useLiveTerms ───────────────────────────────────────────────────
export function useLiveTerms() {
  const [terms, setTerms] = useState<any[]>([])

  const fetch = useCallback(async () => {
    const list = await db.terms.toArray()
    setTerms(list)
  }, [])

  useEffect(() => {
    fetch()
    _listeners.add(fetch)
    return () => { _listeners.delete(fetch) }
  }, [fetch])

  return terms
}
