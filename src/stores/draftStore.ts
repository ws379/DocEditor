import { create } from 'zustand'
import type { Draft } from '../types/editor.types'
import {
  getAllDrafts,
  getDraft,
  createDraft as createDraftInDB,
  saveDraft as saveDraftInDB,
  deleteDraft as deleteDraftInDB,
  saveVersion as saveVersionInDB,
} from '../utils/storage'
import { generateId } from '../utils/id'
import { notifyDBChanged, primeDraftsCache } from '../hooks/useLiveDrafts'
import { toast } from './toastStore'

interface DraftState {
  // State
  drafts: Draft[]
  current: Draft | null

  // Actions
  setCurrent: (draft: Draft | null) => void
  loadDraft: (id: string) => Promise<void>
  handleNew: () => Promise<Draft | null>
  handleDelete: (id: string) => Promise<void>
  handleRename: (id: string, title: string) => Promise<void>
  handleSaveVersion: (getContent: () => string) => Promise<void>
  loadAllDrafts: () => Promise<void>
  saveCurrentDraft: (content: string) => Promise<void>
}

export const useDraftStore = create<DraftState>((set, get) => ({
  // Initial state
  drafts: [],
  current: null,

  // Actions
  setCurrent: (draft) => set({ current: draft }),

  loadDraft: async (id) => {
    const draft = await getDraft(id)
    if (draft) {
      set({ current: draft })
    }
  },

  handleNew: async () => {
    const draft = await createDraftInDB()
    set((state) => ({
      drafts: [draft, ...state.drafts],
      current: draft,
    }))
    notifyDBChanged()
    return draft
  },

  handleDelete: async (id) => {
    await deleteDraftInDB(id)
    notifyDBChanged()
    const { drafts, current, loadDraft, handleNew } = get()
    const remaining = drafts.filter((d) => d.id !== id)
    set({ drafts: remaining })

    if (current?.id === id) {
      if (remaining[0]) {
        await loadDraft(remaining[0].id)
      } else {
        await handleNew()
      }
    }
  },

  handleRename: async (id, title) => {
    const { drafts, current } = get()
    const draft = drafts.find((x) => x.id === id)
    if (draft) {
      const updated = { ...draft, title }
      await saveDraftInDB(updated)
      set((state) => ({
        drafts: state.drafts.map((x) => (x.id === id ? updated : x)),
        current: current?.id === id ? updated : current,
      }))
      notifyDBChanged()
    }
  },

  handleSaveVersion: async (getContent) => {
    const { current } = get()
    if (!current) {
      toast.info('请先创建或打开一个文档')
      return
    }
    await saveVersionInDB({
      id: generateId(),
      draftId: current.id,
      content: getContent(),
      createdAt: Date.now(),
      label: `版本 ${new Date().toLocaleString('zh-CN')}`,
    })
    toast.success('版本快照已保存')
  },

  loadAllDrafts: async () => {
    const list = await getAllDrafts()
    primeDraftsCache(list)
    set({ drafts: list })
    // Auto-select the first draft if no current draft is set
    if (list.length > 0) {
      const { current } = get()
      if (!current) {
        set({ current: list[0] })
      }
    }
  },

  saveCurrentDraft: async (content) => {
    const { current } = get()
    if (!current) return
    const updated = { ...current, content, updatedAt: Date.now() }
    await saveDraftInDB(updated)
    set((state) => ({
      current: updated,
      drafts: state.drafts.map((d) => (d.id === updated.id ? updated : d)),
    }))
    notifyDBChanged()
  },
}))
