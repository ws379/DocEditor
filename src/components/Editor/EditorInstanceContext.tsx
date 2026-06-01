import { createContext, useContext } from 'react'
import type { Editor } from '@tiptap/react'

/**
 * Read-only context for the Tiptap Editor instance.
 * This is the ONLY context that should hold the editor reference.
 * UI state lives in Zustand stores.
 */
interface EditorInstanceContextValue {
  editor: Editor | null
}

export const EditorInstanceContext = createContext<EditorInstanceContextValue>({
  editor: null,
})

export function useEditorInstance() {
  return useContext(EditorInstanceContext)
}
