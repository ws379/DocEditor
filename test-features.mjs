import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 15000 });

const results = [];
const test = (name, pass) => { results.push({ name, pass }); console.log(pass ? '✅' : '❌', name); };

// T1: Page loads
test('页面加载', await page.locator('.ProseMirror, [contenteditable]').first().isVisible().catch(() => false));

// T2: Editor typing
const editor = page.locator('.ProseMirror, [contenteditable]').first();
await editor.click();
await page.keyboard.type('测试文字');
const hasText = (await editor.innerText()).includes('测试文字');
test('编辑器输入文字', hasText);

// T3: Bold
await page.keyboard.press('Control+a');
const boldBtn = page.locator('button[title="加粗"]');
test('加粗按钮', await boldBtn.isVisible().catch(() => false));
await boldBtn.click();
test('加粗生效', await editor.locator('strong, b').first().isVisible().catch(() => false));

// T4: Font select
const fontSelect = page.locator('select').first();
test('字体下拉框', await fontSelect.isVisible().catch(() => false));
await fontSelect.click({ timeout: 3000 }).catch(() => {});
const opts = await fontSelect.locator('option').count();
test('字体可选(' + opts + '项)', opts > 10);

// T5: Font size select
const sizeSelect = page.locator('select').nth(1);
test('字号下拉框', await sizeSelect.isVisible().catch(() => false));

// T6: Ribbon tabs
await page.click('button:has-text("插入")');
await page.waitForTimeout(300);
test('插入选项卡', await page.locator('button:has-text("图片")').first().isVisible().catch(() => false));
await page.click('button:has-text("布局")');
await page.waitForTimeout(300);
test('布局选项卡', await page.locator('button[title="左对齐"]').isVisible().catch(() => false));
await page.click('button:has-text("开始")');
await page.waitForTimeout(300);

// T7: Draft sidebar
test('草稿搜索', await page.locator('input[placeholder*="搜索"]').isVisible().catch(() => false));
test('新建按钮', await page.locator('button[title="新建"]').isVisible().catch(() => false));

// T8: Reference panel
const pdfTab = page.locator('button:has-text("PDF")').first();
test('PDF标签', await pdfTab.isVisible().catch(() => false));

// T9: Translate toggle
const toggleBtn = page.locator('button:has-text("译")').first();
if (await toggleBtn.isVisible().catch(() => false)) {
  const before = await toggleBtn.innerText();
  await toggleBtn.click();
  await page.waitForTimeout(200);
  const after = await toggleBtn.innerText();
  test('翻译开关', before !== after);
  await toggleBtn.click();
}

// T10-T15: Modals
for (const [label, modalText] of [
  ['导出', '导出文档'],
  ['导入', '导入文档'],
  ['版本', '版本历史'],
  ['术语', '术语库管理'],
  ['合并', 'PDF 合并'],
  ['引擎', '翻译引擎配置'],
]) {
  const btn = page.locator('button:has-text("' + label + '")').first();
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(300);
    test(label + '弹窗', await page.locator('text=' + modalText).first().isVisible().catch(() => false));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }
}

// T16: H1-H6
await page.click('button:has-text("开始")');
await page.waitForTimeout(200);
for (let i = 1; i <= 6; i++) {
  test('H' + i, await page.locator('button[title="H' + i + '"]').isVisible().catch(() => false));
}

// Summary
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log('\n=============================');
console.log('通过: ' + passed + '/' + results.length);
if (failed > 0) {
  console.log('失败:');
  results.filter(r => !r.pass).forEach(r => console.log('  ❌ ' + r.name));
}
console.log('=============================');

await browser.close();
process.exit(failed > 0 ? 1 : 0);
