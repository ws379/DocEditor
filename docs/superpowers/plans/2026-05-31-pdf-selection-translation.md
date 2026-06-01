# PDF 自定义矩形选区翻译 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace browser-native text selection in PDF viewer with a custom rectangle drag selection, fixing the "selects too much" and "wrong paragraph translation" issues.

**Architecture:** Custom mousedown/mousemove/mouseup handlers on the PDF container draw a selection overlay rectangle. On mouseup, all TextLayer spans are tested for intersection with the rectangle using `getBoundingClientRect()`. Hit spans are grouped by `data-line`, sorted by `rect.left`, and joined with space/newline detection. The extracted text triggers translation via a callback prop.

**Tech Stack:** React, pdfjs-dist TextLayer, DOM APIs (getBoundingClientRect, getComputedStyle)

---

### Task 1: Add selection-related types and refs to PdfViewer

**Files:**
- Modify: `src/components/ReferencePanel/PdfViewer.tsx:11-27`

- [ ] **Step 1: Add `onSelectText` prop to PdfViewer**

Add the callback prop interface and accept it in the component signature:

```tsx
interface PdfViewerProps {
  onSelectText?: (text: string, rect: DOMRect) => void
}

export function PdfViewer({ onSelectText }: PdfViewerProps) {
```

- [ ] **Step 2: Add selection state and refs**

After the existing refs (line 26), add:

```tsx
  // Rectangle selection state
  const [isSelecting, setIsSelecting] = useState(false)
  const selStart = useRef({ x: 0, y: 0 })
  const selRect = useRef({ left: 0, top: 0, width: 0, height: 0 })
  const selectionOverlayRef = useRef<HTMLDivElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const altHeld = useRef(false)
```

- [ ] **Step 3: Verify build passes**

Run: `cd C:\Users\wisk\vscodeproject\bianjiqi && npx tsc --noEmit`
Expected: No errors (prop is optional, existing callers unaffected)

- [ ] **Step 4: Commit**

```bash
git add src/components/ReferencePanel/PdfViewer.tsx
git commit -m "feat: add onSelectText prop and selection state to PdfViewer"
```

---

### Task 2: Store textLayerRef in renderPage and clear selection on page/scale change

**Files:**
- Modify: `src/components/ReferencePanel/PdfViewer.tsx:64-129`

- [ ] **Step 1: Store textLayerDiv ref in renderPage**

In the `renderPage` function inside the useEffect, after creating `textLayerDiv` and before appending to wrapper, add a ref assignment. Find this block:

```tsx
      const textLayerDiv = document.createElement('div')
      textLayerDiv.className = 'pdf-text-layer'
      wrapper.appendChild(textLayerDiv)
```

Change to:

```tsx
      const textLayerDiv = document.createElement('div')
      textLayerDiv.className = 'pdf-text-layer'
      textLayerRef.current = textLayerDiv
      wrapper.appendChild(textLayerDiv)
```

- [ ] **Step 2: Clear selection overlay on page/scale change**

At the start of the `renderPage` function (after `const container = containerRef.current!`), add:

```tsx
      // Clear any active selection when page/scale changes
      setIsSelecting(false)
      if (selectionOverlayRef.current) {
        selectionOverlayRef.current.style.display = 'none'
      }
```

- [ ] **Step 3: Verify build passes**

Run: `cd C:\Users\wisk\vscodeproject\bianjiqi && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/ReferencePanel/PdfViewer.tsx
git commit -m "feat: store textLayerRef and clear selection on page/scale change"
```

---

### Task 3: Add selection overlay div to JSX

**Files:**
- Modify: `src/components/ReferencePanel/PdfViewer.tsx:275-283` (the canvas mode container div)

- [ ] **Step 1: Add selection overlay div inside the container**

Find the canvas mode container:

```tsx
        <div
          ref={containerRef}
          className="flex-1 overflow-auto border rounded bg-gray-50"
          style={{ cursor: dragMode ? 'grab' : 'text' }}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
        />
```

Change to:

```tsx
        <div
          ref={containerRef}
          className="flex-1 overflow-auto border rounded bg-gray-50 relative"
          style={{ cursor: dragMode ? 'grab' : 'text' }}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
        >
          {/* Selection overlay — only visible during drag-select */}
          <div
            ref={selectionOverlayRef}
            className="absolute pointer-events-none"
            style={{
              display: 'none',
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.5)',
              zIndex: 10,
            }}
          />
        </div>
```

Note: The overlay uses `pointer-events: none` always in CSS. We control interactivity via the mousedown/move/up handlers on the container itself.

- [ ] **Step 2: Verify build passes**

Run: `cd C:\Users\wisk\vscodeproject\bianjiqi && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/ReferencePanel/PdfViewer.tsx
git commit -m "feat: add selection overlay div to PdfViewer"
```

---

### Task 4: Implement core rectangle selection logic (collectHitSpans + handleSelectionStart/Move/End)

**Files:**
- Modify: `src/components/ReferencePanel/PdfViewer.tsx` (add new functions before `handleMouseDown`)

- [ ] **Step 1: Add `collectHitSpans` function**

Add this function before the existing `handleMouseDown`:

```tsx
  // Collect TextLayer spans that intersect with the selection rectangle
  const collectHitSpans = useCallback((containerRect: DOMRect) => {
    const textLayer = textLayerRef.current
    if (!textLayer) return ''

    const spans = textLayer.querySelectorAll('span')
    if (spans.length === 0) return ''

    // Collect all hit spans with their metadata
    type HitSpan = { text: string; line: number; left: number; right: number; top: number; bottom: number }
    const hits: HitSpan[] = []

    spans.forEach(span => {
      const el = span as HTMLElement
      const rect = el.getBoundingClientRect()
      // Intersection test
      const intersects =
        rect.right > containerRect.left &&
        rect.left < containerRect.right &&
        rect.bottom > containerRect.top &&
        rect.top < containerRect.bottom

      if (!intersects) return

      const text = el.textContent?.trim() || ''
      if (!text) return

      const line = parseInt(el.dataset.line || '0', 10)
      hits.push({ text, line, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom })
    })

    if (hits.length === 0) return ''

    // Group by line
    const lineGroups = new Map<number, HitSpan[]>()
    for (const h of hits) {
      const group = lineGroups.get(h.line)
      if (group) group.push(h)
      else lineGroups.set(h.line, [h])
    }

    // Sort lines by vertical position, sort spans within line by left
    const sortedLines = Array.from(lineGroups.entries()).sort((a, b) => {
      const avgTopA = a[1].reduce((s, h) => s + h.top, 0) / a[1].length
      const avgTopB = b[1].reduce((s, h) => s + h.top, 0) / b[1].length
      return avgTopA - avgTopB
    })

    // Get font size for space detection
    const firstSpan = spans[0] as HTMLElement
    const fontSize = parseFloat(getComputedStyle(firstSpan).fontSize) || 12

    const lines: string[] = []

    for (const [, lineSpans] of sortedLines) {
      // Sort by left position (not offsetLeft — avoids CSS Transform issues)
      lineSpans.sort((a, b) => a.left - b.left)

      // Dual-column filter: if two adjacent spans have a gap > fontSize * 2,
      // they are likely in different columns — keep only the one with larger overlap
      const filtered: HitSpan[] = []
      for (let i = 0; i < lineSpans.length; i++) {
        if (i > 0) {
          const gap = lineSpans[i].left - lineSpans[i - 1].right
          if (gap > fontSize * 2) {
            // Two non-adjacent spans — keep the one with larger overlap area
            const prevOverlap = Math.min(lineSpans[i - 1].right, containerRect.right) -
              Math.max(lineSpans[i - 1].left, containerRect.left)
            const currOverlap = Math.min(lineSpans[i].right, containerRect.right) -
              Math.max(lineSpans[i].left, containerRect.left)
            // Replace previous with current if current has more overlap
            if (currOverlap > prevOverlap) {
              filtered.pop()
              filtered.push(lineSpans[i])
            }
            // else keep previous, skip current
            continue
          }
        }
        filtered.push(lineSpans[i])
      }

      // Join spans with space detection
      let lineText = ''
      for (let i = 0; i < filtered.length; i++) {
        if (i > 0) {
          const gap = filtered[i].left - filtered[i - 1].right
          if (gap > fontSize * 0.4) {
            lineText += ' '
          }
        }
        lineText += filtered[i].text
      }
      lines.push(lineText)
    }

    return lines.join('\n')
  }, [])

  // Update selection overlay position
  const updateOverlay = useCallback((left: number, top: number, width: number, height: number) => {
    const overlay = selectionOverlayRef.current
    if (!overlay) return
    overlay.style.display = 'block'
    overlay.style.left = `${left}px`
    overlay.style.top = `${top}px`
    overlay.style.width = `${width}px`
    overlay.style.height = `${height}px`
  }, [])

  const clearOverlay = useCallback(() => {
    const overlay = selectionOverlayRef.current
    if (!overlay) return
    overlay.style.display = 'none'
  }, [])
```

- [ ] **Step 2: Add selection mouse handlers**

Add these after `collectHitSpans` and before the existing `handleMouseDown`:

```tsx
  // Track Alt key for temporary drag mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') altHeld.current = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        altHeld.current = false
        // If user was in a selection and held Alt, cancel it
        if (isSelecting) {
          setIsSelecting(false)
          clearOverlay()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isSelecting, clearOverlay])

  const handleSelectionStart = useCallback((e: React.MouseEvent) => {
    // Only in select mode (not drag mode) and not holding Alt
    if (dragMode || altHeld.current) return false
    if (e.button !== 0) return false

    // Block native double/triple click word selection
    e.preventDefault()

    selStart.current = { x: e.clientX, y: e.clientY }
    selRect.current = { left: e.clientX, top: e.clientY, width: 0, height: 0 }
    setIsSelecting(true)
    return true
  }, [dragMode])

  const handleSelectionMove = useCallback((e: MouseEvent) => {
    if (!isSelecting) return

    const x = Math.min(selStart.current.x, e.clientX)
    const y = Math.min(selStart.current.y, e.clientY)
    const w = Math.abs(e.clientX - selStart.current.x)
    const h = Math.abs(e.clientY - selStart.current.y)

    selRect.current = { left: x, top: y, width: w, height: h }

    // Convert to container-relative coordinates for overlay positioning
    const container = containerRef.current
    if (!container) return
    const containerRect = container.getBoundingClientRect()
    const relX = x - containerRect.left + container.scrollLeft
    const relY = y - containerRect.top + container.scrollTop

    updateOverlay(relX, relY, w, h)
  }, [isSelecting, updateOverlay])

  const handleSelectionEnd = useCallback(() => {
    if (!isSelecting) return
    setIsSelecting(false)

    const { width, height } = selRect.current
    // Too small — treat as click, not selection
    if (width < 3 && height < 3) {
      clearOverlay()
      return
    }

    // Build a DOMRect for hit testing (viewport coordinates)
    const selectionDomRect = new DOMRect(
      selRect.current.left,
      selRect.current.top,
      selRect.current.width,
      selRect.current.height
    )

    const text = collectHitSpans(selectionDomRect)
    clearOverlay()

    if (!text || !onSelectText) return

    // Get the bounding rect of the selection for popup positioning
    onSelectText(text, selectionDomRect)
  }, [isSelecting, collectHitSpans, clearOverlay, onSelectText])
```

- [ ] **Step 3: Wire selection handlers into the existing handleMouseDown**

Replace the existing `handleMouseDown`:

```tsx
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    const container = containerRef.current
    if (!container) return

    // Try selection first (select mode, no Alt)
    if (!dragMode && !altHeld.current) {
      handleSelectionStart(e)
      return
    }

    // Drag mode or Alt held — existing pan logic
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    scrollStart.current = { x: container.scrollLeft, y: container.scrollTop }
    container.style.cursor = 'grabbing'
  }, [dragMode, handleSelectionStart])
```

- [ ] **Step 4: Wire selection move/end into the existing window event listeners**

Replace the existing useEffect that handles mousemove/mouseup for drag:

```tsx
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Selection mode
      if (isSelecting) {
        handleSelectionMove(e)
        return
      }
      // Drag mode
      if (!isDragging.current || !containerRef.current) return
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      containerRef.current.scrollLeft = scrollStart.current.x - dx
      containerRef.current.scrollTop = scrollStart.current.y - dy
    }
    const handleMouseUp = () => {
      // Selection mode
      if (isSelecting) {
        handleSelectionEnd()
        return
      }
      // Drag mode
      if (!isDragging.current) return
      isDragging.current = false
      if (containerRef.current) {
        containerRef.current.style.cursor = dragMode ? 'grab' : 'text'
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragMode, isSelecting, handleSelectionMove, handleSelectionEnd])
```

- [ ] **Step 5: Verify build passes**

Run: `cd C:\Users\wisk\vscodeproject\bianjiqi && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/components/ReferencePanel/PdfViewer.tsx
git commit -m "feat: implement rectangle selection with hit-testing and space detection"
```

---

### Task 5: Update App.tsx — pass callback to PdfViewer, conditionally use useSelection

**Files:**
- Modify: `src/App.tsx:253-264, 329`

- [ ] **Step 1: Import panelTab from editorStore**

In App.tsx, the `panelTab` is already destructured from `useEditorStore()` at line 79. No import change needed.

- [ ] **Step 2: Update PdfViewer rendering to pass onSelectText**

Find line 329:

```tsx
                  {panelTab === 'pdf' && <PdfViewer />}
```

Change to:

```tsx
                  {panelTab === 'pdf' && (
                    <PdfViewer
                      onSelectText={(text, rect) => {
                        let refinedText = refineToWordBoundary(text)
                        refinedText = smartTrimSelection(refinedText, 200)
                        if (!refinedText) return
                        setTranslateSelection({ text: refinedText, rect })
                      }}
                    />
                  )}
```

- [ ] **Step 3: Guard the panelContainerRef useSelection with panelTab condition**

Find lines 259-264:

```tsx
  useSelection({
    containerRef: panelContainerRef,
    enabled: translateEnabled,
    onSelect: handleTranslateSelection,
    ready: showPanel,
  })
```

Change to:

```tsx
  useSelection({
    containerRef: panelContainerRef,
    enabled: translateEnabled && panelTab !== 'pdf',
    onSelect: handleTranslateSelection,
    ready: showPanel,
  })
```

This prevents `useSelection` from interfering with PdfViewer's custom selection when the PDF tab is active. Other tabs (image, code, docx) still use the native selection hook.

- [ ] **Step 4: Verify build passes**

Run: `cd C:\Users\wisk\vscodeproject\bianjiqi && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: pass onSelectText to PdfViewer, guard useSelection for non-PDF tabs"
```

---

### Task 6: Update PdfViewer test for new prop

**Files:**
- Modify: `src/__tests__/pdfViewer.test.tsx`

- [ ] **Step 1: Add test for onSelectText prop**

Add a new test after the existing one:

```tsx
  it('accepts onSelectText prop without error', () => {
    const onSelectText = vi.fn()
    render(<PdfViewer onSelectText={onSelectText} />)
    expect(screen.getByText('拖放 PDF 到此处，或')).toBeDefined()
  })
```

- [ ] **Step 2: Run tests**

Run: `cd C:\Users\wisk\vscodeproject\bianjiqi && npx vitest run src/__tests__/pdfViewer.test.tsx`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/pdfViewer.test.tsx
git commit -m "test: add test for PdfViewer onSelectText prop"
```

---

### Task 7: Add joinSpansWithSpace utility with tests

**Files:**
- Modify: `src/utils/selectionHelper.ts`
- Create/Modify: `src/utils/__tests__/selectionHelper.test.ts`

- [ ] **Step 1: Add `joinSpansWithSpace` utility to selectionHelper.ts**

Append to `src/utils/selectionHelper.ts`:

```typescript
/**
 * Join an array of span texts with smart space insertion.
 * Inserts a space when the gap between adjacent spans exceeds threshold.
 */
export function joinSpansWithSpace(
  spans: Array<{ text: string; right: number; left: number }>,
  fontSize: number
): string {
  if (spans.length === 0) return ''

  let result = spans[0].text
  for (let i = 1; i < spans.length; i++) {
    const gap = spans[i].left - spans[i - 1].right
    if (gap > fontSize * 0.4) {
      result += ' '
    }
    result += spans[i].text
  }
  return result
}
```

- [ ] **Step 2: Add tests for joinSpansWithSpace**

Check if `src/utils/__tests__/selectionHelper.test.ts` exists:

```bash
ls src/utils/__tests__/selectionHelper.test.ts
```

If it doesn't exist, create it with the full test suite. If it exists, append the `joinSpansWithSpace` describe block:

```typescript
describe('joinSpansWithSpace', () => {
  it('joins adjacent spans without space when gap is small', () => {
    const spans = [
      { text: 'Hel', right: 100, left: 50 },
      { text: 'lo', right: 130, left: 102 },
    ]
    expect(joinSpansWithSpace(spans, 12)).toBe('Hello')
  })

  it('inserts space when gap exceeds threshold', () => {
    const spans = [
      { text: 'Hello', right: 100, left: 50 },
      { text: 'world', right: 200, left: 130 },
    ]
    // gap = 130 - 100 = 30, threshold = 12 * 0.4 = 4.8
    expect(joinSpansWithSpace(spans, 12)).toBe('Hello world')
  })

  it('returns empty string for empty input', () => {
    expect(joinSpansWithSpace([], 12)).toBe('')
  })

  it('returns single span text unchanged', () => {
    const spans = [{ text: 'Hello', right: 100, left: 50 }]
    expect(joinSpansWithSpace(spans, 12)).toBe('Hello')
  })
})
```

- [ ] **Step 3: Run tests**

Run: `cd C:\Users\wisk\vscodeproject\bianjiqi && npx vitest run src/utils/__tests__/selectionHelper.test.ts`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/utils/selectionHelper.ts src/utils/__tests__/selectionHelper.test.ts
git commit -m "feat: add joinSpansWithSpace utility with tests"
```

---

### Task 8: Run full test suite and verify build

**Files:**
- None (verification only)

- [ ] **Step 1: Run all tests**

Run: `cd C:\Users\wisk\vscodeproject\bianjiqi && npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Run type check**

Run: `cd C:\Users\wisk\vscodeproject\bianjiqi && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run build**

Run: `cd C:\Users\wisk\vscodeproject\bianjiqi && npx vite build`
Expected: Build succeeds

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address test/build issues from PDF selection refactor"
```
