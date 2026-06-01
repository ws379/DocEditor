import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CharacterCount from '@tiptap/extension-character-count'
import FontFamily from '@tiptap/extension-font-family'
import Typography from '@tiptap/extension-typography'
import { LineHeight } from '../components/Editor/extensions/LineHeight'
import { FontSize } from '../components/Editor/extensions/FontSize'
import { SlashCommand } from '../components/Editor/extensions/SlashCommand'
import { TermHighlight } from '../components/Editor/extensions/TermHighlight'
import { FileEmbed } from '../components/Editor/extensions/FileEmbed'
import { EditorInstanceContext } from '../components/Editor/EditorInstanceContext'

function TestEditorWithAllExtensions() {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
      Underline, TextStyle, FontFamily, Color, Subscript, Superscript, Typography, FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: '开始编辑您的文档...' }),
      Table.configure({ resizable: true }), TableRow, TableCell, TableHeader,
      Link.configure({ openOnClick: false }),
      TaskList, TaskItem.configure({ nested: true }),
      CharacterCount,
      LineHeight,
      SlashCommand,
      TermHighlight.configure({ terms: [] }),
      FileEmbed,
    ],
    content: '<p>测试</p>',
  })

  return (
    <EditorInstanceContext.Provider value={{ editor }}>
      <EditorContent editor={editor} />
    </EditorInstanceContext.Provider>
  )
}

describe('Editor with all extensions', () => {
  it('renders with all extensions', () => {
    const { container } = render(<TestEditorWithAllExtensions />)
    const editor = container.querySelector('.ProseMirror')
    expect(editor).toBeDefined()
    expect(editor?.textContent).toBe('测试')
  })
})
