/**
 * 共享工具栏按钮组件
 */
import React from 'react'

interface ToolbarButtonProps {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  active,
  disabled,
  onClick,
  title,
  children,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded transition-colors ${
      active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
)

/**
 * 工具栏分隔符
 */
export const ToolbarSeparator: React.FC = () => (
  <div className="w-px h-6 bg-gray-200 mx-1" />
)
