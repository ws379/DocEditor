import React, { forwardRef, useImperativeHandle, useState, useEffect, useCallback } from 'react'
import type { CommandItem } from './extensions/SlashCommand'

interface Props {
  items: CommandItem[]
  command: (item: CommandItem) => void
}

export interface SlashCommandMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export const SlashCommandMenu = forwardRef<SlashCommandMenuRef, Props>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index]
        if (item) {
          command(item)
        }
      },
      [items, command]
    )

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex)
          return true
        }
        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 text-sm text-gray-500">
          没有匹配的命令
        </div>
      )
    }

    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-auto w-64">
        <div className="px-2 py-1.5 text-xs text-gray-500 border-b border-gray-100">
          命令
        </div>
        {items.map((item, index) => (
          <button
            key={item.title}
            onClick={() => selectItem(index)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
              index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
            }`}
          >
            <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded text-base">
              {item.icon}
            </span>
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-gray-400">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    )
  }
)

SlashCommandMenu.displayName = 'SlashCommandMenu'
