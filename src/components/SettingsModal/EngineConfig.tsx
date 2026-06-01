import React, { useState, useEffect } from 'react'
import { getEngines, updateEngineConfig, checkEngine, Engine } from '../../services/translateApi'
import { useEditorStore } from '../../stores/editorStore'
import { toast } from '../../stores/toastStore'

const ACTIVE_ENGINE_KEY = 'doceditor_active_engine'

export const EngineConfig: React.FC = () => {
  const { showEngineConfig, setShowEngineConfig } = useEditorStore()
  const [engines, setEngines] = useState<Engine[]>([])
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null)
  const [activeEngine, setActiveEngine] = useState<string>(() => localStorage.getItem(ACTIVE_ENGINE_KEY) || 'tencent')
  const [config, setConfig] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<boolean | null>(null)

  useEffect(() => {
    if (showEngineConfig) loadEngines()
  }, [showEngineConfig])

  const loadEngines = async () => {
    setIsLoading(true)
    try {
      const engineList = await getEngines()
      const filtered = engineList.filter(e => e.name !== 'default')
      setEngines(filtered)

      const active = filtered.find(e => e.name === activeEngine && e.available)
      if (active) {
        setSelectedEngine(active.name)
      } else {
        const firstAvailable = filtered.find(e => e.available)
        if (firstAvailable) setSelectedEngine(firstAvailable.name)
      }
    } catch (err) {
      console.error('Failed to load engines:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectEngine = (engineName: string) => {
    setSelectedEngine(engineName)
    setConfig({})
    setCheckResult(null)
  }

  const handleSetActive = (engineName: string) => {
    setActiveEngine(engineName)
    localStorage.setItem(ACTIVE_ENGINE_KEY, engineName)
  }

  const handleSave = async () => {
    if (!selectedEngine) return
    setIsSaving(true)
    try {
      const success = await updateEngineConfig(selectedEngine, config)
      if (success) {
        toast.success('配置已保存')
        await loadEngines()
      } else {
        toast.error('保存失败')
      }
    } catch (err) {
      toast.error(`保存失败: ${err instanceof Error ? err.message : '未知错误'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCheck = async () => {
    if (!selectedEngine) return
    setIsChecking(true)
    setCheckResult(null)
    try {
      const available = await checkEngine(selectedEngine)
      setCheckResult(available)
    } catch {
      setCheckResult(false)
    } finally {
      setIsChecking(false)
    }
  }

  const getEngineConfigFields = (engineName: string) => {
    switch (engineName) {
      case 'deepseek':
        return [{ key: 'apiKey', label: 'API Key', type: 'password' }]
      case 'tencent':
        return [
          { key: 'secretId', label: 'Secret ID', type: 'text' },
          { key: 'secretKey', label: 'Secret Key', type: 'password' },
        ]
      case 'aliyun':
        return [
          { key: 'accessKeyId', label: 'Access Key ID', type: 'text' },
          { key: 'accessKeySecret', label: 'Access Key Secret', type: 'password' },
        ]
      case 'volcengine':
        return [
          { key: 'accessKeyId', label: 'Access Key ID', type: 'text' },
          { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password' },
        ]
      case 'niutrans':
        return [
          { key: 'apiKey', label: 'API Key', type: 'password' },
          { key: 'appId', label: 'App ID', type: 'text' },
        ]
      default:
        return []
    }
  }

  if (!showEngineConfig) return null

  const onClose = () => setShowEngineConfig(false)
  const availableEngines = engines.filter(e => e.available)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">翻译引擎配置</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Active Engine Selector */}
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <label className="block text-sm font-medium text-slate-700 mb-2">当前使用的翻译引擎</label>
          {availableEngines.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {availableEngines.map((engine) => (
                <button
                  key={engine.name}
                  onClick={() => handleSetActive(engine.name)}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                    activeEngine === engine.name
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                  }`}
                >
                  {engine.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">暂无可用引擎，请先配置至少一个引擎</p>
          )}
          <p className="text-xs text-slate-500 mt-2">选词翻译和全文翻译将使用此引擎</p>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Engine list */}
          <div className="w-1/3 border-r border-slate-200 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {engines.map((engine) => (
                  <button
                    key={engine.name}
                    onClick={() => handleSelectEngine(engine.name)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                      selectedEngine === engine.name ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-800">{engine.label}</span>
                        {activeEngine === engine.name && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">使用中</span>
                        )}
                      </div>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          engine.available ? 'bg-green-500' : 'bg-slate-300'
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Config form */}
          <div className="flex-1 overflow-auto p-4">
            {selectedEngine ? (
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-4">
                  {engines.find((e) => e.name === selectedEngine)?.label || selectedEngine} 配置
                </h3>
                <div className="space-y-4">
                  {getEngineConfigFields(selectedEngine).map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm text-slate-600 mb-1">{field.label}</label>
                      <input
                        type={field.type}
                        value={config[field.key] || ''}
                        onChange={(e) => setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder={`请输入 ${field.label}`}
                      />
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleSave} disabled={isSaving}
                      className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                      {isSaving ? '保存中...' : '保存'}
                    </button>
                    <button onClick={handleCheck} disabled={isChecking}
                      className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50">
                      {isChecking ? '检查中...' : '检查可用性'}
                    </button>
                  </div>
                  {checkResult !== null && (
                    <div className={`p-3 rounded-lg text-sm ${checkResult ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {checkResult ? '引擎可用' : '引擎不可用，请检查配置'}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8">
                <p className="text-sm">选择引擎进行配置</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
