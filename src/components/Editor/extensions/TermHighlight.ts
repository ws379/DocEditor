import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Term } from '../../../services/termStorage'
import { useTermStore } from '../../../stores/termStore'

export interface TermRange {
  from: number
  to: number
  term: Term
}

/**
 * Find all term ranges in a text string.
 * Returns ranges sorted by position, with longest terms first for overlapping matches.
 */
export function findTermRanges(text: string, terms: Term[]): TermRange[] {
  // Sort terms by source length (longest first) for greedy matching
  const sorted = [...terms].sort((a, b) => b.source.length - a.source.length)

  const ranges: TermRange[] = []
  const lowerText = text.toLowerCase()

  for (const term of sorted) {
    const lowerSource = term.source.toLowerCase()
    let startIndex = 0

    while (startIndex < text.length) {
      const index = lowerText.indexOf(lowerSource, startIndex)
      if (index === -1) break

      // Check if this range overlaps with an existing range
      const overlaps = ranges.some(
        (r) => (index >= r.from && index < r.to) || (index + term.source.length > r.from && index + term.source.length <= r.to)
      )

      if (!overlaps) {
        ranges.push({
          from: index,
          to: index + term.source.length,
          term,
        })
      }

      startIndex = index + 1
    }
  }

  // Sort by position
  return ranges.sort((a, b) => a.from - b.from)
}

interface TermHighlightOptions {
  terms: Term[]
  onTermHover?: (term: Term, rect: DOMRect) => void
}

const termHighlightKey = new PluginKey('termHighlight')

/**
 * TipTap extension that highlights terms in the editor using ProseMirror decorations.
 * Terms are underlined with a wavy line and colored background.
 */
export const TermHighlight = Extension.create<TermHighlightOptions>({
  name: 'termHighlight',

  addOptions() {
    return {
      terms: [],
      onTermHover: undefined,
    }
  },

  addProseMirrorPlugins() {
    const self = this

    return [
      new Plugin({
        key: termHighlightKey,
        props: {
          decorations(state) {
            const { doc } = state
            const terms = useTermStore.getState().terms
            if (terms.length === 0) return DecorationSet.empty

            const decorations: Decoration[] = []

            doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return
              const lowerText = node.text.toLowerCase()

              for (const term of terms) {
                const lowerSource = term.source.toLowerCase()
                let idx = 0
                while (idx < node.text.length) {
                  const found = lowerText.indexOf(lowerSource, idx)
                  if (found === -1) break
                  decorations.push(
                    Decoration.inline(pos + found, pos + found + term.source.length, {
                      class: 'term-highlight',
                      'data-term-id': term.id,
                      'data-term-source': term.source,
                      'data-term-target': term.target,
                    })
                  )
                  idx = found + 1
                }
              }
            })

            return decorations.length > 0 ? DecorationSet.create(doc, decorations) : DecorationSet.empty
          },
        },
      }),
    ]
  },

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          termId: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-term-id'),
            renderHTML: (attributes) => {
              if (!attributes.termId) return {}
              return { 'data-term-id': attributes.termId }
            },
          },
        },
      },
    ]
  },
})
