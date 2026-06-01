/**
 * Indent/Outdent TipTap Extension
 * 支持 Tab/Shift-Tab 缩进控制
 */
import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType
      outdent: () => ReturnType
    }
  }
}

export const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'listItem'],
      minLevel: 0,
      maxLevel: 8,
      indentStep: 2, // em
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: element => {
              const level = parseInt(element.style.marginLeft) / 2 || 0
              return Math.min(Math.max(level, this.options.minLevel), this.options.maxLevel)
            },
            renderHTML: attributes => {
              if (!attributes.indent || attributes.indent === 0) return {}
              return { style: `margin-left: ${attributes.indent * this.options.indentStep}em` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state
          tr = tr.setSelection(selection)
          const { from, to } = selection

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0
              if (currentIndent < this.options.maxLevel) {
                tr = tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: currentIndent + 1,
                })
              }
            }
          })

          if (dispatch) dispatch(tr)
          return true
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state
          tr = tr.setSelection(selection)
          const { from, to } = selection

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0
              if (currentIndent > this.options.minLevel) {
                tr = tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: currentIndent - 1,
                })
              }
            }
          })

          if (dispatch) dispatch(tr)
          return true
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      'Shift-Tab': () => this.editor.commands.outdent(),
    }
  },
})
