import React, { useRef, useState, useEffect } from 'react'
import { usePanelStore } from '../../stores/panelStore'

interface CodeViewerProps {
  onCodeLoad?: (code: string, language: string) => void
}

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.java': 'java',
  '.cpp': 'cpp',
  '.c': 'c',
  '.cs': 'csharp',
  '.go': 'go',
  '.rs': 'rust',
  '.rb': 'ruby',
  '.php': 'php',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.scala': 'scala',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.json': 'json',
  '.xml': 'xml',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.md': 'markdown',
  '.sql': 'sql',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.ps1': 'powershell',
  '.dockerfile': 'dockerfile',
  '.graphql': 'graphql',
}

function detectLanguage(filename: string): string {
  const ext = '.' + filename.split('.').pop()?.toLowerCase()
  return LANGUAGE_EXTENSIONS[ext] || 'plaintext'
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ onCodeLoad }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [code, setCode] = useState<string | null>(null)
  const [language, setLanguage] = useState<string>('plaintext')
  const [fileName, setFileName] = useState<string | null>(null)

  // ✅ 持久化状态
  const { states, hydrated, hydrate, setState: setPanelState, clearState } = usePanelStore()

  // ✅ 启动时从 IndexedDB 恢复代码
  useEffect(() => {
    if (!hydrated.code) {
      hydrate('code')
      return
    }
    const saved = states.code
    if (saved && typeof saved.data === 'string') {
      setCode(saved.data)
      setFileName(saved.fileName)
      // 从文件名推断语言
      if (saved.fileName) {
        setLanguage(detectLanguage(saved.fileName))
      }
    }
  }, [hydrated.code, states.code]) // eslint-disable-line react-hooks/exhaustive-deps

  const persistCode = async (text: string, name: string, lang: string) => {
    setCode(text)
    setLanguage(lang)
    setFileName(name)
    onCodeLoad?.(text, lang)
    await setPanelState('code', { data: text, fileName: name, mimeType: 'text/plain' })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      persistCode(reader.result as string, file.name, detectLanguage(file.name))
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      persistCode(reader.result as string, file.name, detectLanguage(file.name))
    }
    reader.readAsText(file)
  }

  const handleClear = async () => {
    setCode(null)
    setFileName(null)
    await clearState('code')
  }

  if (!code) {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="min-h-[300px] flex flex-col items-center justify-center text-slate-400"
      >
        <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        <p className="text-sm mb-2">拖放代码文件到此处</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
        >
          选择文件
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.go,.rs,.rb,.php,.swift,.kt,.scala,.html,.css,.scss,.json,.xml,.yaml,.yml,.md,.sql,.sh,.bash,.zsh,.ps1,.dockerfile,.graphql"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 truncate">{fileName}</span>
          <span className="px-1.5 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
            {language}
          </span>
        </div>
        <button
          onClick={handleClear}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          清除
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <pre className="p-3 bg-slate-50 rounded-lg text-sm font-mono leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}
