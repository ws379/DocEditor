# DocEditor 技术栈完整报告

> 为翻译人员设计的专业在线文档编辑器
> 最后更新：2026-06-01

---

## 一、项目概述

DocEditor 是一个基于 Web 的专业文档编辑器，专为翻译人员设计。核心功能包括富文本编辑、PDF 参考阅读、划词翻译、术语管理、双语对照、多格式导入导出、版本历史、专注模式等。项目采用纯前端架构（PWA），数据持久化基于 IndexedDB，翻译服务通过后端 API 代理。

**项目规模**：80+ 个源文件，约 6000+ 行 TypeScript/TSX 代码

---

## 二、技术架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────┐
│                    用户界面层 (UI)                     │
│  App.tsx → Ribbon → Editor → ReferencePanel → Modal  │
├─────────────────────────────────────────────────────┤
│                  状态管理层 (State)                    │
│         Zustand Stores × 7 + React Hooks × 6         │
├─────────────────────────────────────────────────────┤
│                  服务层 (Services)                     │
│  translateApi / importDoc / exportDoc / pdfMerge      │
│  termStorage / translationMemory / collaboration      │
├─────────────────────────────────────────────────────┤
│                  数据持久层 (Storage)                  │
│         Dexie.js (IndexedDB) + localStorage           │
├─────────────────────────────────────────────────────┤
│                  编辑器引擎层 (Editor)                 │
│       TipTap (ProseMirror) + 8 个自定义扩展            │
└─────────────────────────────────────────────────────┘
```

### 2.2 目录结构

```
src/
├── App.tsx                          # 应用根组件，组合所有模块
├── main.tsx                         # 入口文件（React.StrictMode + ErrorBoundary）
├── components/
│   ├── Editor/                      # 编辑器核心
│   │   ├── TiptapEditor.tsx         # TipTap EditorContent 包装
│   │   ├── EditorInstanceContext.tsx # editor 实例共享 Context
│   │   ├── EditorContext.tsx        # 旧版上下文（已废弃）
│   │   ├── EditorWrapper.tsx        # 编辑器外壳
│   │   ├── DragHandleComponent.tsx  # 自定义拖拽手柄（替代 tiptap 扩展）
│   │   ├── SlashCommandMenu.tsx     # 斜杠命令菜单
│   │   ├── TermTooltip.tsx          # 术语提示框
│   │   └── extensions/              # 自定义 TipTap 扩展（8个）
│   │       ├── FontSize.ts          # 字号控制
│   │       ├── LineHeight.ts        # 行高控制
│   │       ├── Indent.ts            # 缩进控制（Tab/Shift+Tab）
│   │       ├── PageBreak.ts         # 分页符
│   │       ├── SearchReplace.ts     # 查找替换（Ctrl+F / Ctrl+H）
│   │       ├── SlashCommand.ts      # 斜杠命令（/ 触发）
│   │       ├── TermHighlight.ts     # 术语高亮标注
│   │       └── FileEmbed.ts         # 文件嵌入
│   ├── Ribbon/                      # 功能区工具栏
│   │   ├── RibbonTabs.tsx           # 标签页切换（开始/插入/布局）
│   │   ├── TabHome.tsx              # 开始标签（撤销/重做、字体、格式、列表、链接、字数）
│   │   ├── TabInsert.tsx            # 插入标签（图片、表格、分割线、代码块）
│   │   └── TabLayout.tsx            # 布局标签（对齐、行距、引用、上下标、高亮）
│   ├── ReferencePanel/              # 参考面板（6个标签页）
│   │   ├── PanelContainer.tsx       # 面板容器（可拖拽调整宽度 300~900px）
│   │   ├── PdfViewer.tsx            # PDF 查看器（pdfjs-dist canvas + TextLayer）
│   │   ├── ImageViewer.tsx          # 图片查看器
│   │   ├── CodeViewer.tsx           # 代码查看器
│   │   ├── DocxViewer.tsx           # DOCX 查看器（mammoth.js）
│   │   └── TranslateResult.tsx      # 翻译结果面板
│   ├── TranslatePopup/TranslatePopup.tsx  # 翻译弹出气泡
│   ├── SearchReplace/SearchBar.tsx        # 查找替换栏
│   ├── ShortcutPanel/ShortcutPanel.tsx    # 快捷键面板
│   ├── BilingualView/               # 双语对照视图
│   │   ├── BilingualView.tsx        # 主视图（同步滚动）
│   │   └── SegmentRow.tsx           # 句对行组件
│   ├── DraftSidebar/DraftSidebar.tsx # 草稿列表侧边栏
│   ├── ExportModal/ExportModal.tsx   # 导出弹窗
│   ├── ImportModal/ImportModal.tsx   # 导入弹窗
│   ├── PdfMerge/PdfMergeModal.tsx    # PDF 合并弹窗
│   ├── TermManager/TermManager.tsx   # 术语管理器
│   ├── VersionHistory/VersionHistory.tsx # 版本历史
│   ├── SettingsModal/EngineConfig.tsx    # 引擎配置
│   ├── ErrorBoundary.tsx            # React 错误边界
│   └── ui/ToolbarButton.tsx         # 共享工具栏按钮组件
├── hooks/                           # 自定义 Hooks（6个）
│   ├── useSelection.ts              # 文本选择检测（300ms 防抖，长度限制 1-5000）
│   ├── useAutoSave.ts               # 自动保存（1秒防抖，beforeunload 保护）
│   ├── useDrafts.ts                 # 草稿管理
│   ├── useLiveDrafts.ts             # 响应式草稿/版本/术语查询（手动订阅总线）
│   ├── useExport.ts                 # 导出功能
│   └── useFocusMode.ts              # 专注模式
├── stores/                          # Zustand 状态管理（6个）
│   ├── editorStore.ts               # UI 状态（侧边栏、弹窗、面板标签）
│   ├── draftStore.ts                # 草稿 CRUD + 版本快照
│   ├── translationStore.ts          # 翻译开关 + 选区状态
│   ├── termStore.ts                 # 术语 CRUD + 导入导出
│   ├── translationMemoryStore.ts    # 翻译记忆 CRUD + 模糊匹配
│   └── editorStyleStore.ts          # 编辑器样式（字号、行高、字体、主题）
├── services/                        # 服务层（8个）
│   ├── translateApi.ts              # 翻译 API（腾讯/微软/阿里/DeepSeek/GLM）
│   ├── importDoc.ts                 # 文档导入（DOCX/TXT/MD/HTML）
│   ├── exportDoc.ts                 # 文档导出（DOCX/PDF/MD/HTML）
│   ├── exportDocServer.ts           # 服务端 PDF 导出（Playwright 渲染）
│   ├── pdfMerge.ts                  # PDF 合并（pdf-lib）
│   ├── termStorage.ts               # 术语存储（独立 IndexedDB）
│   ├── translationMemory.ts         # 翻译记忆（独立 IndexedDB + 模糊匹配）
│   ├── imageUpload.ts               # 图片上传
│   └── collaboration.ts             # 协作编辑（Yjs）
├── utils/                           # 工具函数
│   ├── db.ts                        # Dexie.js 数据库定义
│   ├── storage.ts                   # idb 存储层（drafts/versions）
│   ├── id.ts                        # ID 生成（prefix + timestamp + random）
│   ├── fuzzyMatch.ts                # 模糊匹配（Levenshtein 距离）
│   └── selectionHelper.ts           # 选区智能处理（词边界精确化、句子收缩）
├── config/api.ts                    # API 配置（VITE_API_BASE_URL）
├── types/editor.types.ts            # TypeScript 类型定义
└── styles/
    └── globals.css                  # 全局样式（ProseMirror、Tailwind 重置修复）
```

---

## 三、核心技术栈

### 3.1 前端框架

| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 18.3.1 | UI 框架，函数式组件 + Hooks |
| **TypeScript** | 5.5.2 | 类型安全，严格模式 |
| **Vite** | 5.3.1 | 构建工具，HMR 开发服务器 |

### 3.2 编辑器引擎

| 技术 | 版本 | 用途 |
|------|------|------|
| **TipTap** | 2.6.6 | 富文本编辑器框架（基于 ProseMirror） |
| **ProseMirror** | （TipTap 内置） | 底层编辑器模型 |
| **@tiptap/starter-kit** | 2.6.6 | 基础扩展包 |

**TipTap 扩展清单（25个）**：

| 扩展 | 来源 | 功能 |
|------|------|------|
| StarterKit | @tiptap/starter-kit | 基础格式（粗体/斜体/标题/列表/引用/代码/分割线/撤销重做） |
| Underline | @tiptap/extension-underline | 下划线 |
| TextStyle | @tiptap/extension-text-style | 文本样式基础 |
| Color | @tiptap/extension-color | 字体颜色 |
| FontFamily | @tiptap/extension-font-family | 字体族 |
| Highlight | @tiptap/extension-highlight | 高亮（多色） |
| TextAlign | @tiptap/extension-text-align | 文本对齐（左/中/右/两端） |
| Image | @tiptap/extension-image | 图片插入（Base64） |
| Placeholder | @tiptap/extension-placeholder | 占位文本 |
| Table/Row/Cell/Header | @tiptap/extension-table* | 表格系统（可调列宽） |
| Link | @tiptap/extension-link | 超链接 |
| TaskList/TaskItem | @tiptap/extension-task-* | 待办列表（嵌套） |
| CharacterCount | @tiptap/extension-character-count | 字数统计 |
| Typography | @tiptap/extension-typography | 排版优化（智能引号） |
| Subscript/Superscript | @tiptap/extension-* | 上下标 |
| FontSize | 自定义 | 字号控制（textStyle mark 属性） |
| LineHeight | 自定义 | 行高控制（paragraph/heading 属性） |
| Indent | 自定义 | 缩进控制（Tab/Shift+Tab，0~8 级） |
| PageBreak | 自定义 | 分页符（打印分页） |
| SearchReplace | 自定义 | 查找替换（Ctrl+F / Ctrl+H） |
| SlashCommand | 自定义 | 斜杠命令（/ 触发，11 种命令） |
| TermHighlight | 自定义 | 术语高亮标注（ProseMirror Decoration） |
| FileEmbed | 自定义 | 文件嵌入（inline atom node） |

### 3.3 状态管理

| 技术 | 版本 | 用途 |
|------|------|------|
| **Zustand** | 5.0.14 | 轻量级状态管理 |

**7 个 Store**：

| Store | 职责 |
|-------|------|
| `editorStore` | UI 状态（侧边栏、弹窗开关、面板标签） |
| `draftStore` | 草稿 CRUD、版本快照、自动选择 |
| `translationStore` | 翻译开关、选区状态（localStorage 持久化） |
| `termStore` | 术语 CRUD、导入导出、模糊匹配 |
| `translationMemoryStore` | 翻译记忆 CRUD、相似度搜索 |
| `editorStyleStore` | 编辑器样式（字号/行高/字体/主题） |
| `panelStore` | 参考面板状态持久化（PDF/图片/代码/DOCX → IndexedDB） |

### 3.4 数据持久化

| 技术 | 版本 | 用途 |
|------|------|------|
| **Dexie.js** | 4.4.3 | IndexedDB 封装（主数据库 DocEditorDB） |
| **idb** | 8.0.3 | IndexedDB 封装（术语库 DocEditorTerms、翻译记忆 DocEditorTM） |
| **localStorage** | 内置 | 用户偏好设置（翻译开关、语言选择、引擎选择） |

**IndexedDB 表（DocEditorDB）**：

| 表名 | 主键 | 索引 | 用途 |
|------|------|------|------|
| `drafts` | id | updatedAt, title | 草稿数据 |
| `versions` | id | draftId, createdAt | 版本快照 |
| `terms` | id | source, createdAt | 术语对 |
| `translationMemory` | id | source, usageCount, createdAt | 翻译记忆 |
| `bilingualSegments` | ++id | source, createdAt | 双语句对 |
| `panelState` | key | — | 参考面板文件持久化（PDF/图片/代码/DOCX） |

### 3.5 样式方案

| 技术 | 版本 | 用途 |
|------|------|------|
| **Tailwind CSS** | 3.4.4 | 原子化 CSS |
| **PostCSS + Autoprefixer** | 8.4.38 / 10.4.19 | CSS 后处理 |

### 3.6 文档处理库

| 库 | 版本 | 用途 |
|------|------|------|
| **pdfjs-dist** | 4.4.168 | PDF 渲染（canvas + TextLayer 文字覆盖） |
| **pdf-lib** | 1.17.1 | PDF 创建与合并 |
| **jspdf** | 2.5.1 | PDF 生成 |
| **html2pdf.js** | 0.14.0 | HTML 转 PDF（html2canvas 方案，支持中文） |
| **docx** | 8.5.0 | DOCX 文件生成 |
| **mammoth** | 1.8.0 | DOCX 转 HTML（ZIP 解析） |
| **marked** | 12.0.2 | Markdown → HTML |
| **turndown** | 7.2.4 | HTML → Markdown |
| **file-saver** | 2.0.5 | 文件下载 |

### 3.7 协作编辑

| 技术 | 版本 | 用途 |
|------|------|------|
| **Yjs** | 13.6.31 | CRDT 协作框架 |
| **y-prosemirror** | 1.3.7 | ProseMirror 绑定 |
| **y-protocols** | 1.0.7 | 协作协议 |

### 3.8 PWA

| 技术 | 版本 | 用途 |
|------|------|------|
| **vite-plugin-pwa** | 1.3.0 | PWA 插件 |
| **Workbox** | 7.4.1 | Service Worker 缓存（NetworkFirst + 静态预缓存） |

### 3.9 测试

| 技术 | 版本 | 用途 |
|------|------|------|
| **Vitest** | 4.1.7 | 单元测试框架 |
| **@testing-library/react** | 16.3.2 | 组件测试 |
| **@testing-library/jest-dom** | 6.9.1 | DOM 断言 |
| **@testing-library/user-event** | 14.6.1 | 用户事件模拟 |
| **jsdom** | 29.1.1 | DOM 模拟 |
| **@playwright/test** | 1.60.0 | E2E 测试 |

---

## 四、功能模块详解

### 4.1 富文本编辑器

- 基于 TipTap/ProseMirror 的所见即所得编辑
- 支持 14 种文本格式（粗体/斜体/下划线/删除线/高亮/上下标/字体/字号/颜色/对齐/行距/缩进/链接/列表）
- 表格插入与编辑（增删行列、表头、可调列宽）
- 图片插入（Base64 内联）、代码块、待办列表（嵌套）
- 斜杠命令快速插入（11 种命令）、拖拽排序（DragHandle）
- 分页符、查找替换（Ctrl+F / Ctrl+H）
- 有序列表重新编号/继续编号

### 4.2 PDF 参考阅读

- `pdfjs-dist` 渲染 PDF 页面到 Canvas + TextLayer 透明文字覆盖
- 增强 CSS 防止"一划一片"（span::selection 隔离、data-line 行号标记）
- 支持缩放（Ctrl+滚轮）、拖拽平移、文本视图/渲染视图切换
- PDF 签名校验（%PDF）

### 4.3 划词翻译系统

1. `useSelection` Hook 检测选区（300ms 防抖 + 长度限制 1-5000 字）
2. `refineToWordBoundary()` 词边界精确化 → `smartTrimSelection()` 句子收缩
3. `TranslatePopup` 弹窗：可编辑源文本、收缩按钮、8 种语言、翻译记忆优先
4. 支持编辑器区域和参考面板双区域选词

**翻译引擎**：腾讯翻译 / 微软翻译 / 阿里翻译 / DeepSeek / GLM

### 4.4 术语管理

- 术语库 CRUD（IndexedDB）、编辑器术语高亮（TermHighlight + TermTooltip）
- 划词翻译时一键保存、模糊匹配（fuzzyMatch）
- CSV/JSON 导入导出

### 4.5 翻译记忆

- 自动保存翻译句对、优先匹配（相似度 ≥ 0.7）、使用次数统计
- 独立 IndexedDB 存储（DocEditorTM）

### 4.6 双语对照

- 选中翻译自动添加句对、逐行显示原文/译文
- 编辑/删除/保存到 IndexedDB/导出 CSV/清空
- 同步滚动（source ↔ target）

### 4.7 文档导入导出

- **导入**：DOCX（mammoth，PK 签名校验）/ TXT / Markdown / HTML
- **导出**：PDF（html2pdf.js，支持中文）/ DOCX（保留格式）/ Markdown（turndown）/ HTML（独立文件）
- 服务端 PDF 导出（Playwright 渲染，矢量文字）

### 4.8 PDF 合并

- `pdf-lib` 合并多个 PDF、拖放排序、页面范围选择

### 4.9 版本管理

- 手动创建版本快照、版本历史列表、一键恢复

### 4.10 专注模式

- 隐藏工具栏/侧边栏/参考面板、编辑器居中加大字号

---

## 五、组件通信架构

```
App.tsx
├── EditorInstanceContext ──→ editor 实例共享（只读）
├── Zustand Stores (6个) ──→ 组件 props/hooks
├── useSelection (2实例) ──→ editor + panel 选区检测
├── useLiveDrafts 总线 ──→ DB 变更通知（notifyDBChanged）
└── React.lazy + Suspense ──→ 16 个模态框/面板懒加载
```

**数据流**：Store → 组件（向下）→ 事件 → Store action → 状态更新 → 重渲染（向上）

---

## 六、性能优化

| 策略 | 实现 |
|------|------|
| 代码分割 | React.lazy 懒加载 16 个模态框/面板组件 |
| Chunk 分割 | Vite manualChunks：tiptap/pdf/office/vendor |
| 防抖 | 翻译 300ms、自动保存 1000ms |
| PWA 缓存 | Workbox NetworkFirst + 静态预缓存 |
| 翻译记忆 | 本地匹配优先减少 API 调用 |
| DB 连接复用 | Dexie.js 连接缓存，避免重复打开 |

---

## 七、测试覆盖

**22 个测试文件，113 个测试用例**：

| 类型 | 文件数 | 用例数 | 覆盖范围 |
|------|--------|--------|----------|
| 组件测试 | 5 | ~30 | App、Editor、PDF Viewer、Imports、Extensions |
| Store 测试 | 6 | ~35 | editorStore、draftStore、translationStore、termStore、translationMemoryStore、editorStyleStore |
| Service 测试 | 3 | ~25 | translateApi、importDoc、translationMemory |
| Utils 测试 | 3 | ~15 | id、api config、fuzzyMatch、db |
| Extension 测试 | 2 | ~6 | SlashCommand、TermHighlight |

---

## 八、依赖统计

| 类别 | 数量 |
|------|------|
| 运行时依赖 | 38 个 |
| 开发依赖 | 11 个 |
| TipTap 扩展 | 25 个（20 官方 + 5 自定义 + 8 自定义扩展文件） |
| 自定义 Hooks | 6 个 |
| Zustand Stores | 7 个 |
| 服务模块 | 8 个 |
| 组件 | 30+ 个 |

---

## 九、localStorage 持久化键

| 键名 | 类型 | 用途 |
|------|------|------|
| `doceditor_translate_enabled` | string ("true"/"false") | 划词翻译开关状态 |
| `doceditor_translate_source` | string | 翻译源语言代码 |
| `doceditor_translate_target` | string | 翻译目标语言代码 |
| `doceditor_active_engine` | string | 翻译引擎选择 |

---

## 十、开发命令

```bash
npm run dev          # 启动开发服务器（localhost:5173）
npm run build        # TypeScript 编译 + Vite 构建
npm run preview      # 预览构建产物
npm run test         # Vitest 监听模式
npm run test:run     # Vitest 单次运行
npm run test:coverage # 覆盖率报告
npx playwright test  # E2E 测试
```
