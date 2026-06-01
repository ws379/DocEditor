"""Server-side PDF generation using Playwright."""

import asyncio
import bleach
from playwright.async_api import async_playwright

# Allow only safe HTML tags for PDF rendering — no scripts, event handlers, or objects
ALLOWED_TAGS = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr', 'div', 'span',
    'ul', 'ol', 'li',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'blockquote', 'pre', 'code',
    'strong', 'em', 'b', 'i', 'u', 's', 'sub', 'sup',
    'a', 'img',
    'figure', 'figcaption',
]
ALLOWED_ATTRS = {
    'a': ['href', 'title'],
    'img': ['src', 'alt', 'width', 'height'],
    'td': ['colspan', 'rowspan'],
    'th': ['colspan', 'rowspan'],
    '*': ['style', 'class'],
}


HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <style>
    body {{
      font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", -apple-system, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 56px;
      line-height: 1.8;
      color: #1a1a1a;
      font-size: 14px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
    }}
    h1 {{ font-size: 28px; font-weight: 700; margin: 20px 0 10px; }}
    h2 {{ font-size: 22px; font-weight: 600; margin: 18px 0 8px; }}
    h3 {{ font-size: 18px; font-weight: 600; margin: 14px 0 6px; }}
    p {{ margin: 8px 0; }}
    ul, ol {{ padding-left: 24px; margin: 8px 0; }}
    li {{ margin: 4px 0; }}
    blockquote {{
      border-left: 4px solid #3b82f6;
      padding: 8px 16px;
      margin: 10px 0;
      background: #f8fafc;
      color: #4b5563;
      font-style: italic;
    }}
    pre {{
      background: #1f2937;
      color: #e5e7eb;
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
    }}
    code {{ font-family: "Courier New", monospace; font-size: 13px; }}
    table {{ border-collapse: collapse; width: 100%; margin: 10px 0; }}
    th, td {{ border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; }}
    th {{ background: #f3f4f6; font-weight: 600; }}
    hr {{ border: none; border-top: 1px solid #e5e7eb; margin: 12px 0; }}
    img {{ max-width: 100%; height: auto; }}
  </style>
</head>
<body>
  {content}
</body>
</html>
"""


async def generate_pdf(html: str, title: str = "document") -> bytes:
    """Generate PDF from HTML using Playwright.
    Sanitizes input HTML to prevent XSS via script injection.
    """
    # Strip dangerous tags (script, object, embed, iframe, event handlers)
    safe_html = bleach.clean(html, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS, strip=True)
    full_html = HTML_TEMPLATE.format(content=safe_html)

    async with async_playwright() as p:
        # --disable-lcd-text: Consistent subpixel rendering across platforms for deterministic PDF output
        # --disable-gpu: Avoid WebGL/GPU init in headless server environments (Docker, CI)
        browser = await p.chromium.launch(args=['--disable-lcd-text', '--disable-gpu'])
        page = await browser.new_page()
        await page.set_content(full_html, wait_until="networkidle")

        pdf_bytes = await page.pdf(
            format="A4",
            margin={"top": "2cm", "right": "2cm", "bottom": "2cm", "left": "2cm"},
            print_background=True,
            prefer_css_page_size=True,
            tagged=True,
            outline=True,
        )

        await browser.close()
        return pdf_bytes
