/**
 * AI 模型配置
 * 支持 Mock 模式和 DeepSeek API 两种模式
 * 后期切换 DeepSeek 只需修改 USE_MOCK 或设置 API Key
 */

// 从 localStorage 读取用户配置的 API Key
const getApiKey = () => localStorage.getItem('deepseek_api_key') || ''

// 是否使用 Mock 模式（没有配置 API Key 时自动使用 Mock）
export const USE_MOCK = !getApiKey()

// 当前使用的模型类型
export const CURRENT_MODEL_TYPE = USE_MOCK ? 'mock' : 'deepseek'

// ===== 模型定义 =====
export const AI_MODELS = {
  mock: {
    id: 'mock',
    name: 'Mock 模拟',
    provider: 'mock',
    description: '本地模拟 AI 回复，用于开发调试',
    supports: {
      thinking: true,      // 深度思考
      code: true,           // 代码块
      formula: true,        // 数学公式 (KaTeX)
      mindmap: true,        // 思维导图 (markmap)
      mermaid: true,        // 流程图/图表 (Mermaid)
      streaming: true,      // 流式输出
      vision: false         // 图片识别
    }
  },

  'deepseek-chat': {
    id: 'deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'deepseek',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    description: 'DeepSeek 对话模型（非思考模式）',
    supports: {
      thinking: false,
      code: true,
      formula: true,
      mindmap: true,
      mermaid: true,
      streaming: true,
      vision: false
    }
  },

  'deepseek-reasoner': {
    id: 'deepseek-reasoner',
    name: 'DeepSeek R1 (推理)',
    provider: 'deepseek',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    description: 'DeepSeek 推理模型（思考模式），擅长复杂推理',
    supports: {
      thinking: true,
      code: true,
      formula: true,
      mindmap: true,
      mermaid: true,
      streaming: true,
      vision: false
    }
  }
}

// ===== 当前模型实例 =====
export const currentModel = AI_MODELS[CURRENT_MODEL_TYPE]

// ===== API 配置 =====
export const API_CONFIG = {
  // Mock 模式下的接口地址（不会被真正调用，仅用于 fetchEventSource 的 url 参数）
  mockUrl: '/api/mock/chat',

  // DeepSeek API 地址
  deepseekUrl: 'https://api.deepseek.com/v1/chat/completions',

  // 获取当前有效的 API URL
  get apiUrl() {
    return USE_MOCK ? this.mockUrl : this.deepseekUrl
  },

  // 获取当前有效的 API Key
  get apiKey() {
    return getApiKey()
  },

  // 获取请求 headers
  get headers() {
    const headers = { 'Content-Type': 'application/json' }
    if (!USE_MOCK && getApiKey()) {
      headers['Authorization'] = `Bearer ${getApiKey()}`
    }
    return headers
  }
}

// ===== 模型能力查询 =====
export function supportsFeature(modelType, feature) {
  const model = AI_MODELS[modelType]
  return model?.supports?.[feature] ?? false
}

export function getAvailableModels() {
  return Object.values(AI_MODELS).map(m => ({
    id: m.id,
    name: m.name,
    description: m.description,
    provider: m.provider
  }))
}

// ===== API Key 管理 =====
export function setApiKey(key) {
  if (key) {
    localStorage.setItem('deepseek_api_key', key)
  } else {
    localStorage.removeItem('deepseek_api_key')
  }
  // 需要刷新页面使配置生效
  window.location.reload()
}

export function hasApiKey() {
  return !!getApiKey()
}
