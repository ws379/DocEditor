import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import type { Editor, Range } from '@tiptap/core'

export interface CommandItem {
  title: string
  description: string
  icon: string
  command: (props: { editor: Editor; range: Range }) => void
}

export function getSuggestionItems({ query }: { query: string }): CommandItem[] {
  const items: CommandItem[] = [
    {
      title: '标题1',
      description: '大标题',
      icon: 'H1',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
      },
    },
    {
      title: '标题2',
      description: '中标题',
      icon: 'H2',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
      },
    },
    {
      title: '标题3',
      description: '小标题',
      icon: 'H3',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
      },
    },
    {
      title: '无序列表',
      description: '创建无序列表',
      icon: '•',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run()
      },
    },
    {
      title: '有序列表',
      description: '创建有序列表',
      icon: '1.',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run()
      },
    },
    {
      title: '任务列表',
      description: '创建任务列表',
      icon: '☑',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run()
      },
    },
    {
      title: '引用',
      description: '创建引用块',
      icon: '❝',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run()
      },
    },
    {
      title: '代码块',
      description: '创建代码块',
      icon: '<>',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
      },
    },
    {
      title: '分割线',
      description: '插入分割线',
      icon: '—',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run()
      },
    },
    {
      title: '表格',
      description: '插入3列表格',
      icon: '⊞',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
      },
    },
    {
      title: '图片',
      description: '插入图片',
      icon: '🖼',
      command: ({ editor, range }) => {
        const url = window.prompt('请输入图片 URL:')
        if (url) {
          editor.chain().focus().deleteRange(range).setImage({ src: url }).run()
        }
      },
    },
  ]

  return items.filter((item) => {
    const q = query.toLowerCase()
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.icon.toLowerCase().includes(q)
    )
  })
}

/**
 * Custom render function for the slash command popup.
 * Uses a DOM element positioned with CSS instead of tippy.js.
 */
function renderPopup() {
  let popupEl: HTMLDivElement | null = null
  let selectedIndex = 0

  return {
    onStart(props: any) {
      popupEl = document.createElement('div')
      popupEl.className = 'slash-command-popup'
      popupEl.style.cssText = 'position:fixed;z-index:1000;background:white;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1);max-height:300px;overflow-y:auto;min-width:200px;padding:4px;'
      document.body.appendChild(popupEl)
      selectedIndex = 0
      this.update(props)
    },
    onUpdate(props: any) {
      if (!popupEl) return
      selectedIndex = 0
      this.update(props)
    },
    update(props: any) {
      if (!popupEl) return
      const { items } = props
      if (!items || items.length === 0) {
        popupEl.style.display = 'none'
        return
      }
      popupEl.style.display = 'block'

      // Position near the caret
      const { view } = props.editor
      const { from } = view.state.selection
      const startCoords = view.coordsAtPos(from)
      popupEl.style.left = `${startCoords.left}px`
      popupEl.style.top = `${startCoords.bottom + 4}px`

      popupEl.innerHTML = items.map((item: CommandItem, i: number) => `
        <div class="slash-command-item${i === selectedIndex ? ' selected' : ''}" data-index="${i}" style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;border-radius:4px;${i === selectedIndex ? 'background:#f3f4f6;' : ''}">
          <span style="width:24px;text-align:center;font-size:14px;">${item.icon}</span>
          <div>
            <div style="font-size:13px;font-weight:500;color:#1f2937;">${item.title}</div>
            <div style="font-size:11px;color:#6b7280;">${item.description}</div>
          </div>
        </div>
      `).join('')

      // Click handlers
      popupEl.querySelectorAll('.slash-command-item').forEach(el => {
        el.addEventListener('click', (e) => {
          const idx = parseInt((e.currentTarget as HTMLElement).dataset.index || '0')
          const item = items[idx]
          if (item) {
            props.command(item)
          }
        })
        el.addEventListener('mouseenter', (e) => {
          selectedIndex = parseInt((e.currentTarget as HTMLElement).dataset.index || '0')
          popupEl?.querySelectorAll('.slash-command-item').forEach((el, i) => {
            (el as HTMLElement).style.background = i === selectedIndex ? '#f3f4f6' : ''
          })
        })
      })
    },
    onKeyDown(props: any) {
      if (!popupEl) return false
      const { event } = props
      if (event.key === 'ArrowDown') {
        selectedIndex = Math.min(selectedIndex + 1, (props.items?.length || 1) - 1)
        this.update(props)
        return true
      }
      if (event.key === 'ArrowUp') {
        selectedIndex = Math.max(selectedIndex - 1, 0)
        this.update(props)
        return true
      }
      if (event.key === 'Enter') {
        const item = props.items?.[selectedIndex]
        if (item) {
          props.command(item)
          return true
        }
      }
      return false
    },
    onExit() {
      if (popupEl) {
        popupEl.remove()
        popupEl = null
      }
    },
  }
}

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        items: ({ query }: { query: string }) => getSuggestionItems({ query }),
        render: renderPopup,
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: CommandItem }) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
