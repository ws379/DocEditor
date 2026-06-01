import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStyleStore } from '../editorStyleStore'

describe('editorStyleStore', () => {
  beforeEach(() => {
    useEditorStyleStore.setState({
      fontSize: 14,
      lineHeight: 1.8,
      fontFamily: 'Microsoft YaHei',
      theme: 'light',
    })
  })

  it('has correct initial state', () => {
    const state = useEditorStyleStore.getState()
    expect(state.fontSize).toBe(14)
    expect(state.lineHeight).toBe(1.8)
    expect(state.fontFamily).toBe('Microsoft YaHei')
    expect(state.theme).toBe('light')
  })

  it('sets font size', () => {
    const { setFontSize } = useEditorStyleStore.getState()
    setFontSize(16)
    expect(useEditorStyleStore.getState().fontSize).toBe(16)
  })

  it('sets line height', () => {
    const { setLineHeight } = useEditorStyleStore.getState()
    setLineHeight(2.0)
    expect(useEditorStyleStore.getState().lineHeight).toBe(2.0)
  })

  it('sets font family', () => {
    const { setFontFamily } = useEditorStyleStore.getState()
    setFontFamily('SimSun')
    expect(useEditorStyleStore.getState().fontFamily).toBe('SimSun')
  })

  it('toggles theme', () => {
    const { toggleTheme } = useEditorStyleStore.getState()
    toggleTheme()
    expect(useEditorStyleStore.getState().theme).toBe('dark')
    toggleTheme()
    expect(useEditorStyleStore.getState().theme).toBe('light')
  })

  it('generates CSS variables', () => {
    const { getCssVariables } = useEditorStyleStore.getState()
    const vars = getCssVariables()
    expect(vars['--editor-font-size']).toBe('14px')
    expect(vars['--editor-line-height']).toBe('1.8')
    expect(vars['--editor-font-family']).toBe('Microsoft YaHei')
  })
})
