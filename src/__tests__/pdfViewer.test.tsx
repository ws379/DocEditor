import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PdfViewer } from '../components/ReferencePanel/PdfViewer'

// Mock db module to avoid IndexedDB issues in jsdom
vi.mock('../utils/db', () => {
  const mockTable = () => ({
    toArray: vi.fn(async () => []),
    add: vi.fn(async () => {}),
    put: vi.fn(async () => {}),
    get: vi.fn(async () => null),
    delete: vi.fn(async () => {}),
    clear: vi.fn(async () => {}),
    orderBy: vi.fn(() => ({ toArray: vi.fn(async () => []), reverse: vi.fn(() => ({ toArray: vi.fn(async () => []) })) })),
    where: vi.fn(() => ({ toArray: vi.fn(async () => []) })),
  })
  return {
    db: {
      drafts: mockTable(), versions: mockTable(), terms: mockTable(),
      translationMemory: mockTable(), bilingualSegments: mockTable(), panelState: mockTable(),
    },
  }
})

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn().mockResolvedValue({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn().mockResolvedValue({
        getViewport: vi.fn().mockReturnValue({ width: 800, height: 600 }),
        render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
        getTextContent: vi.fn().mockResolvedValue({ items: [{ str: 'Test text' }] }),
      }),
    }),
  }),
  TextLayer: vi.fn().mockImplementation(() => ({
    render: vi.fn().mockResolvedValue(undefined),
  })),
}))

describe('PdfViewer', () => {
  it('renders file upload area', () => {
    render(<PdfViewer />)
    expect(screen.getByText('拖放 PDF 到此处，或')).toBeDefined()
    expect(screen.getByText('选择文件')).toBeDefined()
  })

  it('renders without error', () => {
    render(<PdfViewer />)
    expect(screen.getByText('拖放 PDF 到此处，或')).toBeDefined()
  })
})
