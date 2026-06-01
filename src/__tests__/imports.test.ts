import { describe, it, expect } from 'vitest'

describe('Module imports', () => {
  it('can import FileEmbed', async () => {
    const mod = await import('../components/Editor/extensions/FileEmbed')
    expect(mod.FileEmbed).toBeDefined()
  })

  it('can import TermHighlight', async () => {
    const mod = await import('../components/Editor/extensions/TermHighlight')
    expect(mod.TermHighlight).toBeDefined()
  })

  it('can import SlashCommand', async () => {
    const mod = await import('../components/Editor/extensions/SlashCommand')
    expect(mod.SlashCommand).toBeDefined()
  })

  it('can import all stores', async () => {
    const editorStore = await import('../stores/editorStore')
    const draftStore = await import('../stores/draftStore')
    const translationStore = await import('../stores/translationStore')
    const termStore = await import('../stores/termStore')
    const editorStyleStore = await import('../stores/editorStyleStore')
    const tmStore = await import('../stores/translationMemoryStore')

    expect(editorStore.useEditorStore).toBeDefined()
    expect(draftStore.useDraftStore).toBeDefined()
    expect(translationStore.useTranslationStore).toBeDefined()
    expect(termStore.useTermStore).toBeDefined()
    expect(editorStyleStore.useEditorStyleStore).toBeDefined()
    expect(tmStore.useTranslationMemoryStore).toBeDefined()
  })

  it('can import all hooks', async () => {
    const useSelection = await import('../hooks/useSelection')
    const useAutoSave = await import('../hooks/useAutoSave')
    const useLiveDrafts = await import('../hooks/useLiveDrafts')

    expect(useSelection.useSelection).toBeDefined()
    expect(useAutoSave.useAutoSave).toBeDefined()
    expect(useLiveDrafts.useLiveDrafts).toBeDefined()
    expect(useLiveDrafts.useLiveTerms).toBeDefined()
  })

  it('can import all services', async () => {
    const translateApi = await import('../services/translateApi')
    const exportDoc = await import('../services/exportDoc')
    const exportDocServer = await import('../services/exportDocServer')
    const imageUpload = await import('../services/imageUpload')
    const termStorage = await import('../services/termStorage')
    const translationMemory = await import('../services/translationMemory')

    expect(translateApi.translateText).toBeDefined()
    expect(exportDoc.exportToDocx).toBeDefined()
    expect(exportDocServer.exportToPdfServer).toBeDefined()
    expect(imageUpload.uploadImage).toBeDefined()
    expect(termStorage.getAllTerms).toBeDefined()
    expect(translationMemory.TranslationMemory).toBeDefined()
  })
})
