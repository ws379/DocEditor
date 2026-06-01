import React from 'react'
import { useEditorInstance } from '../Editor/EditorInstanceContext'
import { ToolbarButton as Btn, ToolbarSeparator as Sep } from '../ui/ToolbarButton'

export function TabHome() {
  const { editor } = useEditorInstance()
  if (!editor) return null

  const isOrderedList = editor.isActive('orderedList')

  const handleContinueNumbering = () => {
    const { state, view } = editor
    const { doc, selection } = state
    let prevEndNumber = 0

    doc.descendants((node, pos) => {
      if (node.type.name === 'orderedList' && pos + node.nodeSize < selection.from) {
        const start = node.attrs.start || 1
        const count = node.content.content.filter(c => c.type.name === 'listItem').length
        prevEndNumber = start + count - 1
      }
    })

    if (prevEndNumber > 0) {
      const pos = selection.$from
      for (let d = pos.depth; d >= 0; d--) {
        const node = pos.node(d)
        if (node.type.name === 'orderedList') {
          const nodePos = pos.before(d)
          const tr = state.tr.setNodeMarkup(nodePos, undefined, { ...node.attrs, start: prevEndNumber + 1 })
          view.dispatch(tr)
          editor.chain().focus().run()
          return
        }
      }
    }
  }

  const handleRestartNumbering = () => {
    const val = window.prompt('输入起始编号:', '10')
    if (!val) return
    const start = parseInt(val, 10)
    if (isNaN(start) || start < 1) return

    // Use direct ProseMirror transaction for reliable attribute setting
    const { state, view } = editor
    const { selection } = state
    const pos = selection.$from
    // Walk up to find the orderedList node
    for (let d = pos.depth; d >= 0; d--) {
      const node = pos.node(d)
      if (node.type.name === 'orderedList') {
        const nodePos = pos.before(d)
        const tr = state.tr.setNodeMarkup(nodePos, undefined, { ...node.attrs, start })
        view.dispatch(tr)
        editor.chain().focus().run()
        return
      }
    }
  }

  return (
    <div className="flex items-center gap-0.5 px-2">
      <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="撤销">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" /></svg>
      </Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="重做">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" /></svg>
      </Btn>
      <Sep />
      <select onChange={e => { if (e.target.value) editor.chain().focus().setFontFamily(e.target.value).run() }} className="h-7 text-xs border border-gray-200 rounded px-1 bg-white max-w-[100px]" defaultValue="">
        <option value="" disabled>字体</option>
        <optgroup label="中文字体">
          <option value="SimSun">宋体</option><option value="SimHei">黑体</option><option value="Microsoft YaHei">微软雅黑</option><option value="KaiTi">楷体</option><option value="FangSong">仿宋</option><option value="STSong">华文宋体</option><option value="STKaiti">华文楷体</option><option value="STFangsong">华文仿宋</option><option value="STXihei">华文细黑</option><option value="LiSu">隶书</option><option value="YouYuan">幼圆</option>
        </optgroup>
        <optgroup label="英文字体">
          <option value="Arial">Arial</option><option value="Times New Roman">Times New Roman</option><option value="Courier New">Courier New</option><option value="Georgia">Georgia</option><option value="Verdana">Verdana</option><option value="Tahoma">Tahoma</option><option value="Trebuchet MS">Trebuchet MS</option><option value="Palatino">Palatino</option><option value="Garamond">Garamond</option><option value="Comic Sans MS">Comic Sans</option><option value="Impact">Impact</option><option value="Lucida Console">Lucida Console</option>
        </optgroup>
      </select>
      <select onChange={e => { if (e.target.value) editor.chain().focus().setFontSize(e.target.value).run() }} className="h-7 text-xs border border-gray-200 rounded px-1 bg-white w-16" defaultValue="">
        <option value="" disabled>字号</option>
        {[6,8,9,10,11,12,14,16,18,20,22,24,26,28,32,36,40,44,48,54,60,66,72,80,96].map(s => <option key={s} value={`${s}px`}>{s}</option>)}
      </select>
      <Sep />
      <Btn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="加粗"><b className="text-sm">B</b></Btn>
      <Btn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="斜体"><i className="text-sm">I</i></Btn>
      <Btn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="下划线"><u className="text-sm">U</u></Btn>
      <Btn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="删除线"><s className="text-sm">S</s></Btn>
      <Sep />
      <div className="relative"><label title="字体颜色" className="p-1.5 rounded text-gray-600 hover:bg-gray-100 cursor-pointer"><span className="text-xs font-bold">A</span><input type="color" onChange={e => editor.chain().focus().setColor(e.target.value).run()} className="absolute inset-0 opacity-0 cursor-pointer" /></label></div>
      <Sep />
      <Btn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="H1"><span className="text-xs font-bold">H1</span></Btn>
      <Btn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="H2"><span className="text-xs font-bold">H2</span></Btn>
      <Btn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="H3"><span className="text-xs font-bold">H3</span></Btn>
      <Btn active={editor.isActive('heading', { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} title="H4"><span className="text-xs font-bold">H4</span></Btn>
      <Btn active={editor.isActive('heading', { level: 5 })} onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()} title="H5"><span className="text-xs font-bold">H5</span></Btn>
      <Btn active={editor.isActive('heading', { level: 6 })} onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()} title="H6"><span className="text-xs font-bold">H6</span></Btn>
      <Sep />
      <Btn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="无序列表">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" /></svg>
      </Btn>
      <Btn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="有序列表">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" /></svg>
      </Btn>
      {isOrderedList && (
        <>
          <Btn onClick={handleRestartNumbering} title="重新编号（设置起始数字）"><span className="text-xs">🔢</span></Btn>
          <Btn onClick={handleContinueNumbering} title="继续编号（接续上一个列表）"><span className="text-xs">➡️</span></Btn>
        </>
      )}
      <Sep />
      <Btn active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleList('taskList', 'taskItem').run()} title="待办列表">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
      </Btn>
      <Sep />
      <Btn active={editor.isActive('link')} onClick={() => {
        if (editor.isActive('link')) {
          editor.chain().focus().unsetLink().run()
        } else {
          const url = window.prompt('链接URL:')
          if (url) editor.chain().focus().setLink({ href: url }).run()
        }
      }} title="链接">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
      </Btn>
      <Sep />
      <span className="text-xs text-gray-400 px-1" title="字数统计">
        {editor.storage.characterCount?.characters?.() ?? 0} 字
      </span>
    </div>
  )
}
