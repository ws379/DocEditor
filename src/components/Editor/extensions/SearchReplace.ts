/**
 * Search & Replace TipTap Extension
 * 基于 ProseMirror Plugin 实现查找替换功能
 */
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface SearchReplaceOptions {
  searchResultClass: string
  searchResultActiveClass: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    searchReplace: {
      setSearchQuery: (query: string) => ReturnType
      setReplaceQuery: (query: string) => ReturnType
      findNext: () => ReturnType
      findPrev: () => ReturnType
      replaceCurrent: () => ReturnType
      replaceAll: () => ReturnType
    }
  }
}

const pluginKey = new PluginKey('searchReplace')

export const SearchReplace = Extension.create<SearchReplaceOptions>({
  name: 'searchReplace',

  addOptions() {
    return {
      searchResultClass: 'search-result',
      searchResultActiveClass: 'search-result-active',
    }
  },

  addStorage() {
    return {
      searchQuery: '',
      replaceQuery: '',
      results: [] as number[],
      activeResult: -1,
      caseSensitive: false,
      wholeWord: false,
    }
  },

  addCommands() {
    return {
      setSearchQuery:
        (query: string) =>
        () => {
          this.storage.searchQuery = query
          this.storage.activeResult = -1
          this.editor.view.dispatch(this.editor.state.tr.setMeta(pluginKey, { type: 'search' }))
          return true
        },
      setReplaceQuery:
        (query: string) =>
        () => {
          this.storage.replaceQuery = query
          return true
        },
      findNext:
        () =>
        () => {
          if (this.storage.results.length === 0) return false
          this.storage.activeResult = (this.storage.activeResult + 1) % this.storage.results.length
          this.editor.view.dispatch(this.editor.state.tr.setMeta(pluginKey, { type: 'next' }))
          const pos = this.storage.results[this.storage.activeResult]
          if (pos !== undefined) {
            this.editor.commands.setTextSelection({ from: pos, to: pos + this.storage.searchQuery.length })
            this.editor.commands.scrollIntoView()
          }
          return true
        },
      findPrev:
        () =>
        () => {
          if (this.storage.results.length === 0) return false
          this.storage.activeResult = (this.storage.activeResult - 1 + this.storage.results.length) % this.storage.results.length
          this.editor.view.dispatch(this.editor.state.tr.setMeta(pluginKey, { type: 'prev' }))
          const pos = this.storage.results[this.storage.activeResult]
          if (pos !== undefined) {
            this.editor.commands.setTextSelection({ from: pos, to: pos + this.storage.searchQuery.length })
            this.editor.commands.scrollIntoView()
          }
          return true
        },
      replaceCurrent:
        () =>
        () => {
          if (this.storage.activeResult < 0 || !this.storage.replaceQuery) return false
          const pos = this.storage.results[this.storage.activeResult]
          if (pos === undefined) return false

          this.editor.commands.deleteRange({ from: pos, to: pos + this.storage.searchQuery.length })
          this.editor.commands.insertContentAt(pos, this.storage.replaceQuery)
          this.storage.activeResult = -1
          this.editor.view.dispatch(this.editor.state.tr.setMeta(pluginKey, { type: 'replace' }))
          return true
        },
      replaceAll:
        () =>
        () => {
          if (!this.storage.searchQuery) return false
          const { searchQuery, replaceQuery } = this.storage
          // Use a single ProseMirror transaction to avoid index offset issues
          // when searchQuery and replaceQuery have different lengths
          let tr = this.editor.state.tr
          // Process in reverse order to keep positions valid
          const results = [...this.storage.results].reverse()
          for (const pos of results) {
            tr = tr.delete(pos, pos + searchQuery.length)
            tr = tr.insertText(replaceQuery, pos)
          }
          this.storage.activeResult = -1
          tr = tr.setMeta(pluginKey, { type: 'replaceAll' })
          this.editor.view.dispatch(tr)
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    const storage = this.storage

    return [
      new Plugin({
        key: pluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr) {
            if (!storage.searchQuery) return DecorationSet.empty

            const doc = tr.doc
            const results: number[] = []
            const decorations: Decoration[] = []

            doc.descendants((node, pos) => {
              if (!node.isText) return
              const text = node.text!
              let searchStr = storage.searchQuery
              let textStr = text

              if (!storage.caseSensitive) {
                searchStr = searchStr.toLowerCase()
                textStr = textStr.toLowerCase()
              }

              let index = textStr.indexOf(searchStr)
              while (index !== -1) {
                const from = pos + index
                const to = from + searchStr.length
                results.push(from)

                const isActive = results.length - 1 === storage.activeResult
                decorations.push(
                  Decoration.inline(from, to, {
                    class: isActive
                      ? `${storage.searchResultClass} ${storage.searchResultActiveClass}`
                      : storage.searchResultClass,
                  })
                )

                index = textStr.indexOf(searchStr, index + 1)
              }
            })

            storage.results = results
            return DecorationSet.create(doc, decorations)
          },
        },
        props: {
          decorations(state) {
            return this.getState(state) || DecorationSet.empty
          },
        },
      }),
    ]
  },
})
