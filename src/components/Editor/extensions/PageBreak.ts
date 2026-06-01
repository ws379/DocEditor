/**
 * PageBreak TipTap Extension
 * 插入分页符，打印时自动分页
 */
import { Node } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      setPageBreak: () => ReturnType
    }
  }
}

export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,

  parseHTML() {
    return [{ tag: 'hr[data-page-break]' }]
  },

  renderHTML() {
    return ['hr', { 'data-page-break': '', class: 'page-break' }]
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ commands }: { commands: any }) => {
          return commands.insertContent({ type: this.name })
        },
    }
  },
})
