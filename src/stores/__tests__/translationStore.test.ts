import { describe, it, expect, beforeEach } from 'vitest'
import { useTranslationStore } from '../translationStore'

describe('translationStore', () => {
  beforeEach(() => {
    useTranslationStore.setState({
      translateEnabled: true,
      translateSelection: null,
    })
    localStorage.clear()
  })

  it('has correct initial state', () => {
    const state = useTranslationStore.getState()
    expect(state.translateEnabled).toBe(true)
    expect(state.translateSelection).toBeNull()
  })

  it('toggles translate enabled', () => {
    const { toggleTranslate } = useTranslationStore.getState()
    toggleTranslate()
    expect(useTranslationStore.getState().translateEnabled).toBe(false)
    expect(localStorage.getItem('doceditor_translate_enabled')).toBe('false')
    toggleTranslate()
    expect(useTranslationStore.getState().translateEnabled).toBe(true)
    expect(localStorage.getItem('doceditor_translate_enabled')).toBe('true')
  })

  it('sets translate selection', () => {
    const { setTranslateSelection } = useTranslationStore.getState()
    const rect = new DOMRect(10, 20, 100, 30)
    setTranslateSelection({ text: 'hello', rect })
    expect(useTranslationStore.getState().translateSelection).toEqual({ text: 'hello', rect })
  })

  it('clears translate selection', () => {
    const { setTranslateSelection, clearTranslateSelection } = useTranslationStore.getState()
    const rect = new DOMRect(10, 20, 100, 30)
    setTranslateSelection({ text: 'hello', rect })
    clearTranslateSelection()
    expect(useTranslationStore.getState().translateSelection).toBeNull()
  })

  it('does not set selection for empty text', () => {
    const { setTranslateSelection } = useTranslationStore.getState()
    const rect = new DOMRect(10, 20, 100, 30)
    setTranslateSelection({ text: '', rect })
    expect(useTranslationStore.getState().translateSelection).toBeNull()
  })
})
