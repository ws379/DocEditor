import React from 'react'
import { useEditorInstance } from '../Editor/EditorInstanceContext'
import { ToolbarButton as Btn, ToolbarSeparator as Sep } from '../ui/ToolbarButton'

export function TabLayout() {
  const { editor } = useEditorInstance()
  if (!editor) return null
  return (
    <div className="flex items-center gap-0.5 px-2">
      <Btn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="左对齐">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M3 6h18M3 12h12M3 18h16" /></svg>
      </Btn>
      <Btn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="居中">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M3 6h18M6 12h12M4 18h16" /></svg>
      </Btn>
      <Btn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="右对齐">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M3 6h18M9 12h12M5 18h16" /></svg>
      </Btn>
      <Btn active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="两端对齐">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M3 6h18M3 12h18M3 18h18" /></svg>
      </Btn>
      <Sep />
      <select
        onChange={e => {
          const lh = e.target.value
          editor.chain().focus().setLineHeight(lh).run()
        }}
        className="h-7 text-xs border border-gray-200 rounded px-1 bg-white"
        defaultValue=""
      >
        <option value="" disabled>行距</option>
        <option value="1">1.0</option>
        <option value="1.15">1.15</option>
        <option value="1.5">1.5</option>
        <option value="2">2.0</option>
        <option value="2.5">2.5</option>
        <option value="3">3.0</option>
      </select>
      <Sep />
      <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} title="引用">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" /></svg>
      </Btn>
      <Sep />
      <Btn active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()} title="下标">
        <span className="text-xs">X<sub>2</sub></span>
      </Btn>
      <Btn active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()} title="上标">
        <span className="text-xs">X<sup>2</sup></span>
      </Btn>
      <Sep />
      <div className="relative">
        <label title="高亮背景色" className="p-1.5 rounded text-gray-600 hover:bg-gray-100 cursor-pointer flex items-center">
          <span className="text-xs font-bold px-0.5 bg-yellow-200 rounded">H</span>
          <input type="color" defaultValue="#ffff00"
            onChange={e => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
            className="absolute inset-0 opacity-0 cursor-pointer" />
        </label>
      </div>
      <Sep />
      <Btn onClick={() => editor.chain().focus().indent().run()} title="增加缩进 (Tab)">
        <span className="text-xs">⇥</span>
      </Btn>
      <Btn onClick={() => editor.chain().focus().outdent().run()} title="减少缩进 (Shift+Tab)">
        <span className="text-xs">⇤</span>
      </Btn>
      <Sep />
      <Btn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="清除格式">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </Btn>
    </div>
  )
}
