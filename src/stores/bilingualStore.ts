import { create } from 'zustand'
import { db } from '../utils/db'
import { toast } from './toastStore'

export interface BilingualSegment {
  source: string
  target: string
}

interface BilingualState {
  segments: BilingualSegment[]
  loaded: boolean

  loadSegments: () => Promise<void>
  addOrUpdateSegment: (source: string, target: string) => void
  updateSegment: (index: number, newTarget: string) => void
  deleteSegment: (index: number) => void
  saveSegments: () => Promise<void>
  clearSegments: () => Promise<void>
  exportCSV: () => void
}

function escapeCSVField(value: string): string {
  const escaped = value.replace(/"/g, '""')
  const needsPrefix = /^[=+\-@\t\r]/.test(escaped)
  return needsPrefix ? `"'${escaped}"` : `"${escaped}"`
}

export const useBilingualStore = create<BilingualState>((set, get) => ({
  segments: [],
  loaded: false,

  loadSegments: async () => {
    try {
      const rows = await db.bilingualSegments.toArray()
      set({
        segments: rows.map(s => ({ source: s.source, target: s.target })),
        loaded: true,
      })
    } catch (err) {
      console.error('Failed to load bilingual segments:', err)
      set({ loaded: true })
    }
  },

  addOrUpdateSegment: (source, target) => {
    set(state => {
      const exists = state.segments.find(s => s.source === source)
      if (exists) {
        return {
          segments: state.segments.map(s =>
            s.source === source ? { ...s, target } : s
          ),
        }
      }
      return { segments: [...state.segments, { source, target }] }
    })
  },

  updateSegment: (index, newTarget) => {
    set(state => ({
      segments: state.segments.map((s, i) =>
        i === index ? { ...s, target: newTarget } : s
      ),
    }))
  },

  deleteSegment: (index) => {
    set(state => ({
      segments: state.segments.filter((_, i) => i !== index),
    }))
  },

  saveSegments: async () => {
    const { segments } = get()
    await db.bilingualSegments.clear()
    if (segments.length > 0) {
      await db.bilingualSegments.bulkAdd(
        segments.map(s => ({ ...s, createdAt: Date.now() }))
      )
    }
    toast.success('已保存到本地数据库')
  },

  clearSegments: async () => {
    await db.bilingualSegments.clear()
    set({ segments: [] })
  },

  exportCSV: () => {
    const { segments } = get()
    const header = 'source,target'
    const rows = segments.map(s => `${escapeCSVField(s.source)},${escapeCSVField(s.target)}`)
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bilingual-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  },
}))
