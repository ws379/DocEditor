import React from 'react'
import { EditorContent } from '@tiptap/react'
import { useEditorInstance } from './EditorInstanceContext'

interface Props { onUpdate: (html: string) => void }

export function TiptapEditor({ onUpdate }: Props) {
  const { editor } = useEditorInstance()

  React.useEffect(() => {
    if (!editor) return
    const handler = () => onUpdate(editor.getHTML())
    editor.on('update', handler)
    return () => { editor.off('update', handler) }
  }, [editor, onUpdate])

  if (!editor) return null
  return <EditorContent editor={editor} />
}
