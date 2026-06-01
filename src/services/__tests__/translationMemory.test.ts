import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TranslationMemory } from '../translationMemory'

// Mock the idb module
vi.mock('idb', () => ({
  openDB: vi.fn().mockResolvedValue({
    put: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn().mockResolvedValue([]),
    delete: vi.fn(),
  }),
}))

describe('TranslationMemory', () => {
  let tm: TranslationMemory

  beforeEach(() => {
    tm = new TranslationMemory()
    // Reset the db promise
    ;(tm as any).dbPromise = null
  })

  it('creates a TranslationMemory instance', () => {
    expect(tm).toBeDefined()
  })

  it('has add method', () => {
    expect(typeof tm.add).toBe('function')
  })

  it('has getAll method', () => {
    expect(typeof tm.getAll).toBe('function')
  })

  it('has delete method', () => {
    expect(typeof tm.delete).toBe('function')
  })

  it('has findMatches method', () => {
    expect(typeof tm.findMatches).toBe('function')
  })

  it('has importFromJson method', () => {
    expect(typeof tm.importFromJson).toBe('function')
  })

  it('has exportToJson method', () => {
    expect(typeof tm.exportToJson).toBe('function')
  })
})
