import React, { useRef } from 'react'
import { useEditorInstance } from '../Editor/EditorInstanceContext'

export function TabInsert() {
  const { editor } = useEditorInstance()
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!editor) return null

  const addImage = () => {
    fileInputRef.current?.click()
  }

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      editor.chain().focus().setImage({ src: dataUrl }).run()
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const addTable = () => {
    const rows = parseInt(window.prompt('行数:', '3') || '3', 10)
    const cols = parseInt(window.prompt('列数:', '3') || '3', 10)
    if (rows > 0 && cols > 0) {
      editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    }
  }

  const isTable = editor.isActive('table')

  return (
    <div className="flex items-center gap-1 px-2 flex-wrap">
      <button onClick={addImage} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded">📷 图片</button>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
      <button onClick={addTable} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded">📊 表格</button>
      <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded">— 分割线</button>
      <button onClick={() => editor.chain().focus().setPageBreak().run()} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded" title="插入分页符 (Ctrl+Shift+P)">⬓ 分页符</button>
      <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded">{'}'} 代码</button>
      {isTable && (
        <>
          <div className="w-px h-4 bg-gray-200 mx-0.5" />
          <button onClick={() => editor.chain().focus().addRowAfter().run()} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded" title="下方加行">＋行</button>
          <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded" title="右侧加列">＋列</button>
          <button onClick={() => editor.chain().focus().deleteRow().run()} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded" title="删除行">－行</button>
          <button onClick={() => editor.chain().focus().deleteColumn().run()} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded" title="删除列">－列</button>
          <button onClick={() => editor.chain().focus().deleteTable().run()} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded" title="删除表格">删表</button>
        </>
      )}
    </div>
  )
}
