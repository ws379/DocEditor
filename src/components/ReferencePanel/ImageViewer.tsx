import React, { useRef, useState, useEffect } from 'react'
import { usePanelStore } from '../../stores/panelStore'

export const ImageViewer: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  // ✅ 持久化状态
  const { states, hydrated, hydrate, setState: setPanelState, clearState } = usePanelStore()

  // ✅ 启动时从 IndexedDB 恢复图片
  useEffect(() => {
    if (!hydrated.image) {
      hydrate('image')
      return
    }
    const saved = states.image
    if (saved && typeof saved.data === 'string') {
      setImageUrl(saved.data)
      setFileName(saved.fileName)
    }
  }, [hydrated.image, states.image]) // eslint-disable-line react-hooks/exhaustive-deps

  const persistImage = async (dataUrl: string, name: string) => {
    setImageUrl(dataUrl)
    setFileName(name)
    await setPanelState('image', { data: dataUrl, fileName: name, mimeType: 'image/*' })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      persistImage(reader.result as string, file.name)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file || !file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = () => {
      persistImage(reader.result as string, file.name)
    }
    reader.readAsDataURL(file)
  }

  const handleClear = async () => {
    setImageUrl(null)
    setFileName(null)
    await clearState('image')
  }

  if (!imageUrl) {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="min-h-[300px] flex flex-col items-center justify-center text-slate-400"
      >
        <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm mb-2">拖放图片到此处</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
        >
          选择图片
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 truncate">{fileName}</span>
        <button
          onClick={handleClear}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          清除
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <img
          src={imageUrl}
          alt={fileName || 'Preview'}
          className="max-w-full h-auto rounded border border-slate-200"
        />
      </div>
    </div>
  )
}
