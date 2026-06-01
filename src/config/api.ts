/**
 * API 配置
 */

export const API_CONFIG = {
  baseUrl: (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000,
} as const
