import { useRef, useCallback, useEffect } from 'react'
import { useDraftStore } from '../stores/draftStore'

const AUTO_SAVE_DELAY = 3000
const EMPTY_CONTENT = '<p></p>'

/**
 * Auto-save hook with race condition protection.
 * If no current draft exists, creates one automatically on first edit.
 * Uses saveInProgressRef to prevent data loss when edits arrive during an ongoing save.
 */
export function useAutoSave(getContent: () => string) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDirtyRef = useRef(false)
  const saveInProgressRef = useRef(false)
  const markDirtyRef = useRef<() => void>(() => {})

  const ensureDraft = useCallback(async () => {
    const { current, handleNew, saveCurrentDraft } = useDraftStore.getState()
    if (current) return current
    // No draft yet — create one and save the current editor content into it
    const draft = await handleNew()
    if (draft) {
      const content = getContent()
      if (content && content !== EMPTY_CONTENT) {
        await saveCurrentDraft(content)
      }
    }
    return draft
  }, [getContent])

  const performSave = useCallback(async () => {
    if (saveInProgressRef.current) return
    saveInProgressRef.current = true
    isDirtyRef.current = false
    try {
      const draft = await ensureDraft()
      if (draft) {
        const content = getContent()
        if (content && content !== EMPTY_CONTENT) {
          const { saveCurrentDraft } = useDraftStore.getState()
          await saveCurrentDraft(content)
        }
      }
    } finally {
      saveInProgressRef.current = false
      // If edits arrived while saving, trigger another save cycle
      if (isDirtyRef.current) {
        markDirtyRef.current()
      }
    }
  }, [getContent, ensureDraft])

  const markDirty = useCallback(() => {
    isDirtyRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { performSave() }, AUTO_SAVE_DELAY)
  }, [performSave])

  // Keep ref in sync to avoid circular dependency between performSave and markDirty
  markDirtyRef.current = markDirty

  const saveNow = useCallback(async () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    isDirtyRef.current = false
    try {
      const draft = await ensureDraft()
      if (draft) {
        const content = getContent()
        if (content && content !== EMPTY_CONTENT) {
          const { saveCurrentDraft } = useDraftStore.getState()
          await saveCurrentDraft(content)
        }
      }
    } catch (e) {
      isDirtyRef.current = true
      throw e
    }
  }, [getContent, ensureDraft])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current || saveInProgressRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => {
      window.removeEventListener('beforeunload', handler)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { markDirty, saveNow }
}
