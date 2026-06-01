/**
 * Calculate Levenshtein distance between two strings.
 * Used for fuzzy matching of translation memory entries.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length

  // Create matrix
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  // Base cases
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  // Fill matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  return dp[m][n]
}

/**
 * Calculate similarity ratio between two strings (0 to 1).
 * 1 = identical, 0 = completely different
 */
export function similarity(a: string, b: string): number {
  if (a === b) return 1
  if (a.length === 0 || b.length === 0) return 0

  const maxLen = Math.max(a.length, b.length)
  const distance = levenshteinDistance(a, b)
  return 1 - distance / maxLen
}

/**
 * Check if a string fuzzy-includes a query.
 * Uses character-by-character similarity check.
 */
export function fuzzyIncludes(text: string, query: string, threshold = 0.7): boolean {
  if (text.includes(query)) return true

  const queryLower = query.toLowerCase()
  const textLower = text.toLowerCase()

  // Check similarity of the whole strings first
  if (similarity(textLower, queryLower) >= threshold) {
    return true
  }

  // Sliding window approach for substrings
  const windowSize = queryLower.length
  for (let i = 0; i <= textLower.length - windowSize; i++) {
    const window = textLower.slice(i, i + windowSize)
    if (similarity(window, queryLower) >= threshold) {
      return true
    }
  }

  return false
}
