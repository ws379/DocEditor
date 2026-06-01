import { createContext, useContext } from 'react'
import type { Editor } from '@tiptap/react'

/**
 * @deprecated Use EditorInstanceContext instead.
 * This context is kept for backward compatibility only.
 */
interface EditorContextValue { editor: Editor | null }
export const EditorContext = createContext<EditorContextValue>({ editor: null })

/**
 * @deprecated Use useEditorInstance() instead.
 */
export function useCurrentEditor() { return useContext(EditorContext) }
