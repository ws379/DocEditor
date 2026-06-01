import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { EditorInstanceContext } from '../components/Editor/EditorInstanceContext'

// Mock IndexedDB
vi.mock('idb', () => ({
  openDB: vi.fn().mockResolvedValue({
    put: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn().mockResolvedValue([]),
    delete: vi.fn(),
    where: vi.fn().mockReturnValue({
      equals: vi.fn().mockReturnValue({
        delete: vi.fn(),
        reverse: vi.fn().mockReturnValue({
          sortBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    orderBy: vi.fn().mockReturnValue({
      reverse: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      }),
    }),
  }),
}))

function TestEditor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Hello</p>',
  })

  return (
    <EditorInstanceContext.Provider value={{ editor }}>
      <EditorContent editor={editor} />
    </EditorInstanceContext.Provider>
  )
}

describe('Editor', () => {
  it('renders with basic StarterKit', () => {
    const { container } = render(<TestEditor />)
    const editor = container.querySelector('.ProseMirror')
    expect(editor).toBeDefined()
    expect(editor?.textContent).toBe('Hello')
  })
})
