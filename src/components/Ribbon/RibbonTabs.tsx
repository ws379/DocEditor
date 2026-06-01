import React, { useState } from 'react'
import { TabHome } from './TabHome'
import { TabInsert } from './TabInsert'
import { TabLayout } from './TabLayout'

const TABS = [
  { key: 'home', label: '开始', Component: TabHome },
  { key: 'insert', label: '插入', Component: TabInsert },
  { key: 'layout', label: '布局', Component: TabLayout },
]

export function RibbonTabs() {
  const [active, setActive] = useState('home')
  const ActiveComponent = TABS.find(t => t.key === active)?.Component || TabHome
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex items-end px-2 gap-0.5 h-8">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActive(tab.key)}
            className={`px-3 py-1 text-xs rounded-t transition-colors ${active === tab.key ? 'bg-white text-blue-600 font-semibold border border-gray-200 border-b-white' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="h-10 flex items-center border-t border-gray-100"><ActiveComponent /></div>
    </div>
  )
}
