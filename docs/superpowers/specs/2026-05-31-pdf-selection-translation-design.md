# PDF 自定义矩形选区翻译设计

## 问题

PDF 划词翻译存在三个问题：
1. **一划划一片**：TextLayer span 全部 `position: absolute`，浏览器原生选区在绝对定位元素间跳跃，选中视觉上不相邻的文本
2. **精准度缺失**：TextLayer span 坐标与 canvas 渲染位置存在偏移，选中文本与用户看到的不一致
3. **划一片翻译另一篇**：选区高亮位置正确但翻译内容错位，或选区本身就跳到其他位置

## 方案

完全绕过浏览器原生选区，实现自定义矩形拖拽选区。

## 核心机制

1. 在 PdfViewer 中拦截 mousedown/mousemove/mouseup
2. 用户拖拽时绘制半透明蓝色矩形 overlay
3. mouseup 时遍历 TextLayer 所有 `<span>`，用 `getBoundingClientRect()` 判断哪些 span 与选区矩形相交
4. 命中 span 按 `data-line` 分组，行内按 `rect.left` 排序（统一用 `getBoundingClientRect().left`，不用 `offsetLeft`，避免 CSS Transform 和 offsetParent 影响）
5. 行内拼接时检测相邻 span 间距：`nextRect.left - currentRect.right > fontSize * 0.4` 时补空格
6. 行间用换行符连接
7. 拼接出选中文本后触发翻译

## 选区判定

```
span 与选区矩形相交条件：
spanRect.right > selRect.left &&
spanRect.left < selRect.right &&
spanRect.bottom > selRect.top &&
spanRect.top < selRect.bottom
```

**整词命中**：span 级别相交即取整词，不截断头尾 span 的文本，体验更好。

## 双栏 PDF 处理

同一 `data-line` 上存在左右不相邻的命中 span 时（间距 > 字号 × 2），仅保留与选区矩形重叠面积更大的一方。这避免双栏 PDF 中选区跨栏抓取错误文本。

## 选区高亮

在 TextLayer 上方叠加 `<div>` 作为选区矩形视觉反馈（蓝色半透明），替代浏览器原生选区高亮。拖拽过程中实时更新矩形位置。

**pointer-events 控制**：
- 拖拽过程中：`pointer-events: auto`（捕获 mousemove）
- 非拖拽状态/翻译弹窗弹出后：`pointer-events: none`（不阻挡下层交互）

## 模式切换

- **选中模式**（默认）：鼠标拖拽 = 选区矩形 → 触发翻译
- **拖拽模式**：鼠标拖拽 = 平移滚动（现有逻辑不变）

两种模式互斥，通过现有工具栏按钮切换。

**临时切换快捷键**：在选中模式下，按住 Alt 键拖拽时临时切换为平移模式，松开恢复选中模式。

## 双击/三击行为

不支持双击选词和三击选行。在选中模式下屏蔽原生双击/三击选词行为，避免视觉混乱。

## Tab 切换状态

从 PDF Tab 切换到其他 Tab 再切回来：选区 overlay 清空，模式重置为默认选中模式。不记忆切换前的状态。

## 与 useSelection 的关系

PDF 区域不再使用 `useSelection` hook。PdfViewer 通过回调直接调用 `setTranslateSelection`。App.tsx 中 `panelContainerRef` 的 useSelection 调用加条件，仅在非 PDF tab 时生效。

## 文件改动

| 文件 | 改动 |
|------|------|
| `PdfViewer.tsx` | 新增矩形选区逻辑、选区 overlay、命中 span 收集排序、翻译触发回调 |
| `App.tsx` | 将 `setTranslateSelection` 通过回调传给 PdfViewer，panelContainerRef useSelection 加条件 |
| `useSelection.ts` | 无改动 |
| `selectionHelper.ts` | 无改动（`smartTrimSelection` 仍可用于后处理） |

## 边界情况

- 选区太小（< 3px 移动）→ 忽略，视为点击
- 选区跨页 → 当前只支持单页选区（翻页后清空）
- 选区无命中 span → 不触发翻译
- 缩放/翻页后 → 清空选区 overlay
- 双栏 PDF → 按重叠面积取单栏

## 性能

MVP 阶段 mouseup 单次遍历所有 span 的 `getBoundingClientRect()` 足够（几百个 span 耗时 < 10ms）。后续若遇瓶颈，可改用 `textContent.items` 纯数据计算 + 缩放比例数学映射。

## 测试要点

- 选中模式下拖拽显示蓝色矩形
- mouseup 后翻译弹窗显示正确文本
- 拖拽模式下不触发选区
- Alt 键临时切换拖拽
- 翻页/缩放后选区清空
- 选区太小不触发翻译
- 跨行选区文本按行序正确拼接
- 双栏 PDF 选区不跨栏
- 相邻 span 间距大时自动补空格
- 双击/三击不触发选词
- Tab 切换后状态重置
