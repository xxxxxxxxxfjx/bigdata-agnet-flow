import { ref, onUnmounted, watch } from 'vue'
import { CHART_TYPE_CONFIG } from '../config/chartTypes.js'

/**
 * 数据绑定层 — 策略模式的数据获取
 *
 * 三种数据源策略：
 * - mock:    从 chartTypes 中读取 mockData()，返回演示数据
 * - static:  直接使用组件 config 中的字段值（用户手动填写）
 * - api:     fetch 远程 API（预留，纯静态部署时降级为 mock）
 *
 * 后续扩展只需实现新的 Adapter：
 *   class WebSocketAdapter { async fetch(config) {} }
 *   class GraphQLAdapter { async fetch(config) {} }
 *
 * @param {Ref} componentRef - 组件对象 ref（包含 data.config.dataSource 和 data.config）
 * @returns {{ data, loading, error, refresh, startPolling, stopPolling, lastRefreshTime }}
 */
export function useDataBinding(componentRef) {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const lastRefreshTime = ref(null)

  let pollingTimer = null

  /**
   * Mock 数据源适配器
   */
  function fetchMock(type) {
    const config = CHART_TYPE_CONFIG[type]
    if (config && config.mockData) {
      return config.mockData()
    }
    return {}
  }

  /**
   * Static 数据源适配器 — 从 config 中提取业务字段
   */
  function fetchStatic(comp) {
    if (!comp || !comp.data || !comp.data.config) return {}
    // 返回 config 中的业务字段（排除 dataSource 和样式相关）
    const { dataSource, theme, colors, ...businessFields } = comp.data.config
    return businessFields
  }

  /**
   * API 数据源适配器 — fetch 远程数据（预留）
   * 纯静态部署时不触发真实请求，降级返回 mock 数据
   */
  async function fetchApi(comp) {
    if (!comp || !comp.data || !comp.data.config) return {}
    const ds = comp.data.config.dataSource || {}
    if (!ds.apiUrl) {
      console.warn('[DataBinding] API 数据源未配置 URL，降级使用 mock 数据')
      return fetchMock(comp.type)
    }

    try {
      const headers = {}
      if (ds.apiHeaders) {
        try {
          Object.assign(headers, JSON.parse(ds.apiHeaders))
        } catch { /* ignore parse errors */ }
      }

      const fetchOptions = {
        method: ds.apiMethod || 'GET',
        headers: { 'Content-Type': 'application/json', ...headers },
      }
      if (ds.apiMethod === 'POST' && ds.requestBody) {
        fetchOptions.body = ds.requestBody
      }

      const response = await fetch(ds.apiUrl, fetchOptions)
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)

      let result = await response.json()

      // 支持 dataPath 提取嵌套数据，如 'data.list' 或 'result.items'
      if (ds.apiDataPath) {
        const paths = ds.apiDataPath.split('.')
        for (const p of paths) {
          if (result && typeof result === 'object' && p in result) {
            result = result[p]
          } else {
            console.warn(`[DataBinding] dataPath "${ds.apiDataPath}" 未找到，返回原始数据`)
            break
          }
        }
      }
      return result
    } catch (err) {
      console.error('[DataBinding] API 请求失败:', err.message)
      // 失败时降级为 mock
      return fetchMock(comp.type)
    }
  }

  /**
   * 核心：从数据源获取数据
   */
  async function refresh() {
    const comp = componentRef.value || componentRef
    if (!comp || !comp.type) return

    loading.value = true
    error.value = null

    try {
      const ds = comp.data?.config?.dataSource
      const sourceType = ds?.type || 'mock'
      let result

      switch (sourceType) {
        case 'api':
          result = await fetchApi(comp)
          break
        case 'static':
          result = fetchStatic(comp)
          break
        case 'mock':
        default:
          result = fetchMock(comp.type)
          break
      }

      data.value = result
      lastRefreshTime.value = new Date().toISOString()
    } catch (err) {
      error.value = err.message || '数据获取失败'
      console.error('[DataBinding] refresh error:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 启动定时轮询
   * @param {number} intervalSec 轮询间隔（秒）
   */
  function startPolling(intervalSec) {
    stopPolling()
    if (!intervalSec || intervalSec <= 0) return

    const intervalMs = intervalSec * 1000
    pollingTimer = setInterval(() => {
      refresh()
    }, intervalMs)
  }

  /**
   * 停止定时轮询
   */
  function stopPolling() {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
  }

  /**
   * 监听 dataSource.refreshInterval 变化，自动启停轮询
   */
  function setupAutoPolling() {
    const comp = componentRef.value || componentRef
    const ds = comp?.data?.config?.dataSource
    const interval = ds?.refreshInterval || 0

    if (interval > 0) {
      startPolling(interval)
    } else {
      stopPolling()
    }
  }

  // 如果传入的是 ref，监听变化
  if (componentRef.value !== undefined) {
    watch(
      () => componentRef.value?.data?.config?.dataSource?.refreshInterval,
      () => setupAutoPolling(),
      { immediate: false }
    )
  }

  // 初始加载
  refresh()
  setupAutoPolling()

  // 清理
  onUnmounted(() => {
    stopPolling()
  })

  return {
    data,
    loading,
    error,
    refresh,
    startPolling,
    stopPolling,
    lastRefreshTime,
  }
}

/**
 * 数据源适配器基类（用于后续扩展）
 *
 * 使用方式：
 *   class MyWebSocketAdapter extends DataSourceAdapter {
 *     async fetch(config) { ... }
 *     transform(data) { ... }
 *   }
 */
export class DataSourceAdapter {
  /**
   * 从数据源获取原始数据
   * @param {object} config - dataSource 配置
   * @returns {Promise<any>}
   */
  async fetch(config) {
    throw new Error('Not implemented')
  }

  /**
   * 将原始数据转换为图表可用格式
   * @param {any} rawData
   * @returns {object} 图表字段映射
   */
  transform(rawData) {
    return rawData
  }
}
