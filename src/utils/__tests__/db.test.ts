import { describe, it, expect } from 'vitest'
import { db } from '../db'

describe('Dexie Database', () => {
  it('has drafts table', () => {
    expect(db.drafts).toBeDefined()
  })

  it('has versions table', () => {
    expect(db.versions).toBeDefined()
  })

  it('has terms table', () => {
    expect(db.terms).toBeDefined()
  })

  it('has correct database name', () => {
    expect(db.name).toBe('DocEditorDB')
  })
})
