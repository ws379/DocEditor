import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import React from 'react'

interface FileEmbedOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fileEmbed: {
      insertFile: (options: { url: string; name: string; size?: number }) => ReturnType
    }
  }
}

const ALLOWED_PROTOCOLS = ['http:', 'https:']

function safeOpenUrl(url: string): void {
  try {
    const parsed = new URL(url)
    if (ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  } catch {
    // ignore invalid URLs
  }
}

const FileEmbedComponent = ({ node }: { node: any }) => {
  const { url, name, size } = node.attrs

  const formatSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf': return '📄'
      case 'doc': case 'docx': return '📝'
      case 'xls': case 'xlsx': return '📊'
      case 'ppt': case 'pptx': return '📽'
      case 'zip': case 'rar': case '7z': return '📦'
      case 'txt': return '📃'
      default: return '📎'
    }
  }

  return React.createElement('div', {
    className: 'file-embed-wrapper',
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      background: '#f3f4f6',
      borderRadius: '6px',
      border: '1px solid #e5e7eb',
      cursor: 'pointer',
      margin: '4px 0',
    },
    onClick: () => safeOpenUrl(url),
  }, [
    React.createElement('span', { key: 'icon', style: { fontSize: '20px' } }, getFileIcon(name)),
    React.createElement('div', { key: 'info', style: { display: 'flex', flexDirection: 'column' } }, [
      React.createElement('span', { key: 'name', style: { fontSize: '14px', fontWeight: 500, color: '#374151' } }, name),
      size ? React.createElement('span', { key: 'size', style: { fontSize: '12px', color: '#9ca3af' } }, formatSize(size)) : null,
    ]),
  ])
}

export const FileEmbed = Node.create<FileEmbedOptions>({
  name: 'fileEmbed',

  group: 'inline',

  inline: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      url: {
        default: null,
      },
      name: {
        default: 'file',
      },
      size: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-file-embed]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-file-embed': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileEmbedComponent)
  },

  addCommands() {
    return {
      insertFile:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})
