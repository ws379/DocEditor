# 版本更新说明 v1.1.0

**发布日期**: 2026-05-31

---

## 🐛 Bug 修复

### 1. 草稿不保存 / 刷新后丢失（严重）

**问题描述**:
编辑器在用户输入后自动创建草稿，但刷新页面后草稿消失，侧边栏显示"暂无草稿"。

**根因分析**（通过 Playwright MCP 逐步调试发现）:

这是一个由 **三个独立问题叠加** 导致的复合 bug：

#### 问题 A：竞态条件导致内容被清空

`useAutoSave` hook 中的 `ensureDraft` 函数在创建新草稿时，调用 `handleNew()` 创建了一个 `content: ''` 的空草稿。`handleNew()` 更新 Zustand store 的 `current` 状态后，App.tsx 中的 `useEffect` 同步 hook 检测到 `current` 变化，将编辑器内容重置为空字符串。随后 `saveCurrentDraft` 保存了空内容。

**时序图**:
```
用户输入 → markDirty() → 1秒后 ensureDraft()
  → handleNew() 创建 content: '' 的草稿
  → set({ current: draft }) 更新 store
  → useEffect 检测到 current 变化
  → editor.setContent('') ← 清空了用户输入！
  → saveCurrentDraft('') ← 保存了空内容
```

**修复**: 在 `useEffect` 中添加 `lastSyncedIdRef` 跟踪，仅在切换到不同草稿时才同步内容，而不是每次 `current` 更新都同步。

```typescript
// 修复前
useEffect(() => {
  if (editor && current) {
    const editorContent = editor.getHTML()
    if (editorContent !== current.content) {
      editor.commands.setContent(current.content || '')  // 每次都重置！
    }
  }
}, [editor, current])

// 修复后
const lastSyncedIdRef = useRef<string | null>(null)
useEffect(() => {
  if (editor && current && current.id !== lastSyncedIdRef.current) {
    lastSyncedIdRef.current = current.id
    editor.commands.setContent(current.content || '')  // 仅切换草稿时同步
  }
}, [editor, current])
```

#### 问题 B：`ensureDraft` 未保存当前编辑器内容

`ensureDraft` 在创建新草稿后，没有将当前编辑器内容写入草稿。

**修复**: 创建草稿后立即保存编辑器内容。

```typescript
// 修复前
const draft = await handleNew()
return draft

// 修复后
const draft = await handleNew()
if (draft) {
  const content = getContent()
  if (content && content !== '<p></p>') {
    await saveCurrentDraft(content)
  }
}
return draft
```

#### 问题 C：`useLiveQuery` 在 React 18 Strict Mode 下不触发重新渲染

`DraftSidebar` 使用 `dexie-react-hooks` 的 `useLiveQuery` 加载草稿列表。但在 React 18 Strict Mode 下，`useLiveQuery` 的 observable 订阅在组件卸载/重挂载时被错误地清理，导致数据查询成功但组件不重新渲染。

**验证过程**（通过 Playwright MCP）:
1. 直接查询 IndexedDB → 数据存在（count: 1, contentLen: 39）
2. 通过 Dexie API 查询 → 数据存在
3. 但 `useLiveQuery` 返回空数组 → 侧边栏显示"暂无草稿"
4. 控制台报错：`Should have a queue. This is likely a bug in React.`

**修复**: 移除 `dexie-react-hooks` 依赖，改用手动订阅模式。

```typescript
// 修复前（useLiveQuery）
export function useLiveDrafts() {
  return useLiveQuery(() =>
    db.drafts.orderBy('updatedAt').reverse().toArray()
  ) ?? []
}

// 修复后（手动订阅 + 全局刷新总线）
const _listeners = new Set<() => void>()

export function notifyDBChanged() {
  _listeners.forEach(fn => fn())
}

export function useLiveDrafts(): Draft[] {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const fetch = useCallback(async () => {
    const list = await db.drafts.orderBy('updatedAt').reverse().toArray()
    setDrafts(list)
  }, [])

  useEffect(() => {
    fetch()  // 初始加载
    _listeners.add(fetch)  // 订阅后续变更
    return () => { _listeners.delete(fetch) }
  }, [fetch])

  return drafts
}
```

在 `draftStore` 和 `termStore` 的每个 DB 写入操作后调用 `notifyDBChanged()`。

---

### 2. DragHandle 不显示（中等）

**问题描述**:
`@tiptap/extension-drag-handle` 扩展已正确导入和配置，CSS 样式已定义，但拖拽手柄在页面上完全不可见。

**根因分析**（通过 Playwright MCP DOM 检查发现）:

1. `document.querySelectorAll('.drag-handle')` 返回 0 个元素
2. `document.querySelectorAll('[data-tippy-root]')` 返回 0 个元素
3. DragHandle 扩展的 `addProseMirrorPlugins` 方法虽然被调用，但 tippy.js 弹出层未正确初始化

该扩展内部使用 tippy.js 定位拖拽手柄元素。在某些环境下（Vite HMR + React Strict Mode），tippy 实例的创建和 DOM 挂载存在时序问题，导致弹出层从未被添加到 DOM。

**修复**: 创建自定义 `DragHandleComponent` React 组件替代 tiptap 内置扩展。

```typescript
// 新文件: src/components/Editor/DragHandleComponent.tsx
export function DragHandleComponent() {
  // 监听编辑器区域的 mousemove 事件
  // 找到鼠标所在的块级节点
  // 在该节点左侧显示 grip 图标
  // 支持原生拖拽（HTML5 Drag & Drop API）
}
```

**实现细节**:
- 使用 `mousemove` 事件检测鼠标位置
- 向上遍历 DOM 树找到最近的块级元素（p, h1-h6, li, blockquote 等）
- 通过 `editor.view.posAtDOM()` 获取 ProseMirror 文档位置
- 使用 `position: fixed` 定位到块级元素左侧
- 150ms 延迟隐藏，避免鼠标从内容移动到手柄时闪烁
- 支持 `draggable` 属性和 `onDragStart` 事件

---

## 🔧 重构

### 1. 移除 `dexie-react-hooks` 依赖

**原因**: 与 React 18 Strict Mode 不兼容，导致组件不重新渲染。

**影响范围**:
- `src/hooks/useLiveDrafts.ts` — 完全重写，4 个 hook 全部改用手动订阅
- `src/stores/draftStore.ts` — 添加 `notifyDBChanged()` 调用
- `src/stores/termStore.ts` — 添加 `notifyDBChanged()` 调用

### 2. 替换 `@tiptap/extension-drag-handle`

**原因**: 内置扩展的 tippy.js 初始化在 Vite + React 环境下不可靠。

**影响范围**:
- `src/App.tsx` — 移除 DragHandle 扩展，添加 DragHandleComponent
- `src/components/Editor/DragHandleComponent.tsx` — 新文件
- `src/styles/globals.css` — 更新 `.drag-handle` 样式

---

## 📝 修改的文件清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `src/hooks/useLiveDrafts.ts` | 重写 | 移除 dexie-react-hooks，改用手动订阅 + 全局刷新总线 |
| `src/stores/draftStore.ts` | 修改 | 添加 notifyDBChanged() 调用 |
| `src/stores/termStore.ts` | 修改 | 添加 notifyDBChanged() 调用 |
| `src/hooks/useAutoSave.ts` | 修改 | ensureDraft 创建草稿后保存编辑器内容 |
| `src/App.tsx` | 修改 | 修复 useEffect 同步逻辑，替换 DragHandle 扩展 |
| `src/components/Editor/DragHandleComponent.tsx` | 新增 | 自定义 DragHandle 组件 |
| `src/styles/globals.css` | 修改 | 更新 .drag-handle 样式 |

---

## 🧪 测试验证

通过 Playwright MCP 进行了端到端验证：

1. ✅ 页面加载后侧边栏显示已有草稿（延迟 ~3 秒异步加载）
2. ✅ 编辑器内容正确恢复为保存的 HTML
3. ✅ 字数统计正确显示（32 字）
4. ✅ 输入新内容后自动保存（1 秒防抖）
5. ✅ 刷新页面后草稿和内容均保留
6. ✅ DragHandle 元素存在于 DOM（count: 1）
7. ✅ DragHandle 样式正确（display: flex, visibility: visible, opacity: 0.4）
8. ✅ DragHandle 位于视口内（isInViewport: true）
9. ✅ TypeScript 编译通过（tsc --noEmit 无错误）
10. ✅ 控制台无新增错误

---

## ⚠️ 已知限制

1. **DragHandle 拖拽排序**: 当前 DragHandle 仅显示图标和触发原生拖拽事件，尚未实现块级节点的拖拽排序功能（需要 ProseMirror NodeRange 插件支持）
2. **草稿加载延迟**: 由于改用手动订阅模式，草稿列表在页面加载后有 ~3 秒延迟才显示（IndexedDB 异步查询）
3. **dexie-react-hooks 残留**: `package.json` 中仍保留 `dexie-react-hooks` 依赖，可在后续清理

---

## 🔮 后续计划

- [ ] 实现 DragHandle 拖拽排序功能
- [ ] 优化草稿加载性能（考虑预加载或缓存）
- [ ] 清理 `dexie-react-hooks` 依赖
- [ ] 添加草稿自动保存状态指示器
- [ ] 实现多文档标签页
