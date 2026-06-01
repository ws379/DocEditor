/**
 * 测试环境配置
 */
import '@testing-library/jest-dom'

// Mock IndexedDB — full shim for Dexie.js / idb in jsdom
class MockIDBRequest {
  result: any = null
  onsuccess: ((e: any) => void) | null = null
  onerror: ((e: any) => void) | null = null
  onupgradeneeded: ((e: any) => void) | null = null
  readyState = 'done'
  error = null
  transaction = null
  source = null
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true }
}

class MockIDBDatabase {
  name = 'test'
  version = 1
  objectStoreNames = { contains: () => false, length: 0, item: () => null }
  createObjectStore = vi.fn(() => ({ createIndex: vi.fn(), add: vi.fn(), put: vi.fn(), get: vi.fn(() => new MockIDBRequest()), delete: vi.fn() }))
  deleteObjectStore = vi.fn()
  transaction = vi.fn(() => ({
    objectStore: vi.fn(() => ({
      add: vi.fn(() => new MockIDBRequest()),
      put: vi.fn(() => new MockIDBRequest()),
      get: vi.fn(() => new MockIDBRequest()),
      delete: vi.fn(() => new MockIDBRequest()),
      getAll: vi.fn(() => new MockIDBRequest()),
      getAllKeys: vi.fn(() => new MockIDBRequest()),
      clear: vi.fn(() => new MockIDBRequest()),
      count: vi.fn(() => new MockIDBRequest()),
      openCursor: vi.fn(() => new MockIDBRequest()),
      index: vi.fn(() => ({ openCursor: vi.fn(() => new MockIDBRequest()), getAll: vi.fn(() => new MockIDBRequest()) })),
    })),
    oncomplete: null,
    onerror: null,
    onabort: null,
    abort: vi.fn(),
    objectStoreNames: { contains: () => false },
  }))
  close = vi.fn()
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true }
}

const mockDB = new MockIDBDatabase()

const mockIDBFactory = {
  open: vi.fn(() => {
    const req = new MockIDBRequest() as any
    req.result = mockDB
    setTimeout(() => {
      if (req.onupgradeneeded) req.onupgradeneeded({ target: req })
      if (req.onsuccess) req.onsuccess({ target: req })
    }, 0)
    return req
  }),
  deleteDatabase: vi.fn(() => {
    const req = new MockIDBRequest() as any
    setTimeout(() => { if (req.onsuccess) req.onsuccess({ target: req }) }, 0)
    return req
  }),
  databases: vi.fn(() => Promise.resolve([])),
}

// Define globals that idb/Dexie expect in jsdom
if (typeof globalThis.IDBRequest === 'undefined') {
  (globalThis as any).IDBRequest = MockIDBRequest
}
if (typeof globalThis.IDBDatabase === 'undefined') {
  (globalThis as any).IDBDatabase = MockIDBDatabase
}
if (typeof globalThis.IDBKeyRange === 'undefined') {
  (globalThis as any).IDBKeyRange = {
    bound: vi.fn(),
    only: vi.fn(),
    lowerBound: vi.fn(),
    upperBound: vi.fn(),
  }
}

Object.defineProperty(window, 'indexedDB', { value: mockIDBFactory })

// Mock URL.createObjectURL
URL.createObjectURL = vi.fn(() => 'blob:mock')
URL.revokeObjectURL = vi.fn()

// Mock tippy.js for DragHandle extension
vi.mock('tippy.js', () => {
  const tippy = Object.assign(
    vi.fn(() => ({
      destroy: vi.fn(),
      hide: vi.fn(),
      show: vi.fn(),
      setContent: vi.fn(),
      setProps: vi.fn(),
    })),
    {
      hideAll: vi.fn(),
      followCursor: 'followCursor',
      animateFill: 'animateFill',
      sticky: 'sticky',
    }
  )
  return { default: tippy, __esModule: true }
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
