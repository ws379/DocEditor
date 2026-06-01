/**
 * 选区智能处理工具
 * 解决"一划一片"问题：将过长选区收缩到句子/词组边界
 */

/**
 * 将选区文本智能收缩到句子边界
 * 例如："Hello world. This is a test. Another sentence"
 *   如果选中了全部，只取中间那句 → "This is a test."
 */
export function smartTrimSelection(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) return text

  // 句子分隔符（中英文都支持）
  const sentenceBreaks = /[。！？.!?\n]/

  // 按句子分割
  const sentences = text.split(sentenceBreaks).filter(s => s.trim().length > 0)

  if (sentences.length === 0) return text.slice(0, maxLength)

  // 从中间取尽量多的完整句子
  const midIndex = Math.floor(sentences.length / 2)
  let result = ''
  let i = midIndex

  // 从中间向两边扩展，直到超长
  while (i >= 0 && i < sentences.length) {
    const candidate = sentences.slice(midIndex, i + 1).join('。') + '。'
    if (candidate.length > maxLength) break
    result = candidate
    i++
  }

  // 如果一句都装不下，硬截断
  if (!result) {
    result = sentences[midIndex].slice(0, maxLength)
  }

  return result.trim()
}

/**
 * 选区精确化：以词边界为最小单位
 * 去掉开头和结尾的非字母/非汉字字符
 */
export function refineToWordBoundary(text: string): string {
  return text
    .replace(/^[^\p{L}\p{N}]+/u, '') // 去掉开头的标点/空格
    .replace(/[^\p{L}\p{N}]+$/u, '') // 去掉结尾的标点/空格
}

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
