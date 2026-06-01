/**
 * ID 生成工具函数
 */

/**
 * 生成唯一 ID
 * @param prefix 可选前缀
 */
export function generateId(prefix?: string): string {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  return prefix ? `${prefix}_${id}` : id
}
