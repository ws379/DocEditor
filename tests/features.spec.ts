import { test, expect } from '@playwright/test';

test.describe('编辑器功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
  });

  test('页面加载', async ({ page }) => {
    const editor = page.locator('.ProseMirror, [contenteditable]').first();
    await expect(editor).toBeVisible();
  });

  test('编辑器输入文字', async ({ page }) => {
    const editor = page.locator('.ProseMirror, [contenteditable]').first();
    await editor.click();
    await page.keyboard.type('测试文字');
    await expect(editor).toContainText('测试文字');
  });

  test('加粗功能', async ({ page }) => {
    const editor = page.locator('.ProseMirror, [contenteditable]').first();
    await editor.click();
    await page.keyboard.type('粗体');
    await page.keyboard.press('Control+a');
    await page.locator('button[title="加粗"]').click();
    await expect(editor.locator('strong, b').first()).toBeVisible();
  });

  test('字体下拉框可点击', async ({ page }) => {
    const fontSelect = page.locator('select').first();
    await expect(fontSelect).toBeVisible();
    await fontSelect.click();
    const opts = await fontSelect.locator('option').count();
    expect(opts).toBeGreaterThan(10);
  });

  test('字号下拉框可点击', async ({ page }) => {
    const sizeSelect = page.locator('select').nth(1);
    await expect(sizeSelect).toBeVisible();
    await sizeSelect.click();
    const opts = await sizeSelect.locator('option').count();
    expect(opts).toBeGreaterThan(10);
  });

  test('Ribbon选项卡切换', async ({ page }) => {
    await page.click('button:has-text("插入")');
    await expect(page.locator('button:has-text("图片")').first()).toBeVisible();
    await page.click('button:has-text("布局")');
    await expect(page.locator('button[title="左对齐"]')).toBeVisible();
    await page.click('button:has-text("开始")');
    await expect(page.locator('button[title="加粗"]')).toBeVisible();
  });

  test('草稿侧边栏', async ({ page }) => {
    await expect(page.locator('input[placeholder*="搜索"]')).toBeVisible();
    await expect(page.locator('button[title="新建"]')).toBeVisible();
  });

  test('翻译开关切换', async ({ page }) => {
    const btn = page.locator('button:has-text("译")').first();
    const before = await btn.innerText();
    await btn.click();
    const after = await btn.innerText();
    expect(before).not.toBe(after);
    await btn.click();
  });

  test('H1-H6按钮', async ({ page }) => {
    for (let i = 1; i <= 6; i++) {
      await expect(page.locator(`button[title="H${i}"]`)).toBeVisible();
    }
  });

  test('导出弹窗', async ({ page }) => {
    await page.locator('button:has-text("导出")').first().click();
    await expect(page.locator('text=导出文档')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('导入弹窗', async ({ page }) => {
    await page.locator('button:has-text("导入")').first().click();
    await expect(page.locator('text=导入文档')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('版本历史弹窗', async ({ page }) => {
    await page.locator('button:has-text("版本")').first().click();
    await expect(page.locator('text=版本历史')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('术语管理弹窗', async ({ page }) => {
    await page.locator('button:has-text("术语")').first().click();
    await expect(page.locator('text=术语库管理')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('PDF合并弹窗', async ({ page }) => {
    await page.locator('button:has-text("合并")').first().click();
    await expect(page.locator('text=PDF 合并')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('引擎配置弹窗', async ({ page }) => {
    await page.locator('button:has-text("引擎")').first().click();
    await expect(page.locator('text=翻译引擎配置')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('PDF查看器空状态', async ({ page }) => {
    // 先打开参考面板
    const refBtn = page.locator('button:has-text("参考"), button[title*="参考"]').first();
    if (await refBtn.isVisible().catch(() => false)) {
      await refBtn.click();
      await page.waitForTimeout(300);
    }
    const pdfTab = page.locator('button:has-text("PDF")').first();
    if (await pdfTab.isVisible().catch(() => false)) {
      await pdfTab.click();
      await page.waitForTimeout(300);
      await expect(page.locator('text=拖放 PDF').first()).toBeVisible();
    }
  });

  test('PDF拖拽/选中模式切换', async ({ page }) => {
    const refBtn = page.locator('button:has-text("参考"), button[title*="参考"]').first();
    if (await refBtn.isVisible().catch(() => false)) {
      await refBtn.click();
      await page.waitForTimeout(300);
    }
    const pdfTab = page.locator('button:has-text("PDF")').first();
    if (await pdfTab.isVisible().catch(() => false)) {
      await pdfTab.click();
      await page.waitForTimeout(300);
      const modeBtn = page.locator('button:has-text("🔤"), button:has-text("✋")').first();
      if (await modeBtn.isVisible().catch(() => false)) {
        const before = await modeBtn.innerText();
        await modeBtn.click();
        await page.waitForTimeout(100);
        const after = await modeBtn.innerText();
        expect(before).not.toBe(after);
        await modeBtn.click();
      }
    }
  });

  test('图片查看器空状态', async ({ page }) => {
    const imgTab = page.locator('button:has-text("图片")').first();
    if (await imgTab.isVisible()) {
      await imgTab.click();
      await page.waitForTimeout(300);
      await expect(page.locator('text=拖放图片').first()).toBeVisible();
    }
  });

  test('代码查看器空状态', async ({ page }) => {
    const codeTab = page.locator('button:has-text("代码")').first();
    if (await codeTab.isVisible()) {
      await codeTab.click();
      await page.waitForTimeout(300);
      await expect(page.locator('text=拖放代码').first()).toBeVisible();
    }
  });

  test('翻译面板语言选择', async ({ page }) => {
    const translateTab = page.locator('button:has-text("翻译")').last();
    if (await translateTab.isVisible()) {
      await translateTab.click();
      await page.waitForTimeout(300);
      const selects = page.locator('.flex-1 select, select').filter({ has: page.locator('option') });
      const count = await selects.count();
      expect(count).toBeGreaterThanOrEqual(2);
    }
  });

  test('参考面板拖拽条存在', async ({ page }) => {
    const refBtn = page.locator('button:has-text("参考"), button[title*="参考"]').first();
    if (await refBtn.isVisible().catch(() => false)) {
      await refBtn.click();
      await page.waitForTimeout(300);
    }
    const panel = page.locator('text=参考面板').first();
    if (await panel.isVisible().catch(() => false)) {
      const dragHandle = page.locator('.cursor-col-resize').first();
      await expect(dragHandle).toBeAttached();
    }
  });

  test('斜体/下划线/删除线按钮', async ({ page }) => {
    await expect(page.locator('button[title="斜体"]')).toBeVisible();
    await expect(page.locator('button[title="下划线"]')).toBeVisible();
    await expect(page.locator('button[title="删除线"]')).toBeVisible();
  });

  test('无序/有序/待办列表按钮', async ({ page }) => {
    await expect(page.locator('button[title="无序列表"]')).toBeVisible();
    await expect(page.locator('button[title="有序列表"]')).toBeVisible();
    await expect(page.locator('button[title="待办列表"]')).toBeVisible();
  });

  test('链接按钮', async ({ page }) => {
    await expect(page.locator('button[title="链接"]')).toBeVisible();
  });

  test('撤销/重做按钮', async ({ page }) => {
    await expect(page.locator('button[title="撤销"]')).toBeVisible();
    await expect(page.locator('button[title="重做"]')).toBeVisible();
  });

  test('布局选项卡功能按钮', async ({ page }) => {
    await page.click('button:has-text("布局")');
    await page.waitForTimeout(200);
    await expect(page.locator('button[title="左对齐"]')).toBeVisible();
    await expect(page.locator('button[title="居中"]')).toBeVisible();
    await expect(page.locator('button[title="右对齐"]')).toBeVisible();
    await expect(page.locator('button[title="两端对齐"]')).toBeVisible();
    await expect(page.locator('button[title="引用"]')).toBeVisible();
    await expect(page.locator('button[title="下标"]')).toBeVisible();
    await expect(page.locator('button[title="上标"]')).toBeVisible();
    await expect(page.locator('button[title="清除格式"]')).toBeVisible();
  });

  test('插入选项卡功能按钮', async ({ page }) => {
    await page.click('button:has-text("插入")');
    await page.waitForTimeout(200);
    await expect(page.locator('button:has-text("图片")').first()).toBeVisible();
    await expect(page.locator('button:has-text("表格")').first()).toBeVisible();
    await expect(page.locator('button:has-text("分割线")').first()).toBeVisible();
    await expect(page.locator('button:has-text("代码")').first()).toBeVisible();
  });

  test('新建草稿', async ({ page }) => {
    await page.locator('button[title="新建"]').click();
    await page.waitForTimeout(500);
    const editor = page.locator('.ProseMirror, [contenteditable]').first();
    await editor.click();
    await page.keyboard.type('新草稿内容');
    await expect(editor).toContainText('新草稿内容');
  });

  test('版本历史保存当前版本', async ({ page }) => {
    await page.locator('button:has-text("版本")').first().click();
    await page.waitForTimeout(500);
    const saveBtn = page.locator('button:has-text("保存当前版本")');
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(500);
    }
    await page.keyboard.press('Escape');
  });

  test('术语管理添加术语', async ({ page }) => {
    await page.locator('button:has-text("术语")').first().click();
    await page.waitForTimeout(300);
    const inputs = page.locator('input[placeholder="原文"], input[placeholder="译文"]');
    await inputs.first().fill('hello');
    await inputs.nth(1).fill('你好');
    await page.locator('button:has-text("添加")').click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=hello').first()).toBeVisible();
    await page.keyboard.press('Escape');
  });
});
