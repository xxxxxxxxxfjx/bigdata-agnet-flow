import { onUnmounted, ref, watch } from 'vue'
import { CHART_TYPE_CONFIG } from '../config/chartTypes.js'

const DATASET_STORAGE_KEY = 'bigdata_agent_flow_datasets'

function getComponent(componentRef) {
  return componentRef?.value !== undefined ? componentRef.value : componentRef
}

function getByPath(input, path) {
  if (!path) return input
  return String(path).split('.').reduce((obj, key) => {
    if (obj && typeof obj === 'object' && key in obj) return obj[key]
    return undefined
  }, input)
}

function parseJsonObject(value) {
  if (!value || typeof value !== 'string') return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function loadDatasets() {
  try {
    return JSON.parse(localStorage.getItem(DATASET_STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function mapDatasetPreview(dataset, mapping) {
  if (!dataset?.preview?.length || !dataset?.fields?.length) return {}
  const fieldNames = dataset.fields.map((field) => field.name)
  const columns = Object.entries(mapping).reduce((acc, [configKey, fieldName]) => {
    const idx = fieldNames.indexOf(fieldName)
    if (idx >= 0) acc[configKey] = dataset.preview.map((row) => row[idx]).join(',')
    return acc
  }, {})
  return columns
}

export function useDataBinding(componentRef) {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const lastRefreshTime = ref(null)
  let pollingTimer = null

  function fetchMock(type) {
    const config = CHART_TYPE_CONFIG[type]
    return config?.mockData ? config.mockData() : {}
  }

  function fetchStatic(comp) {
    if (!comp?.data?.config) return {}
    const { dataSource, theme, colors, ...businessFields } = comp.data.config
    return businessFields
  }

  function fetchDataset(comp) {
    const ds = comp?.data?.config?.dataSource || {}
    const datasets = loadDatasets()
    const dataset = datasets.find((item) => item.id === ds.datasetId || item.name === ds.datasetId)
    if (!dataset) return fetchMock(comp.type)
    const mapping = parseJsonObject(ds.fieldMapping)
    const mapped = mapDatasetPreview(dataset, mapping)
    if (Object.keys(mapped).length > 0) return mapped

    if (comp.type === 'table') {
      return {
        title: dataset.name,
        columns: dataset.fields.map((field) => field.name).join(','),
        rows: dataset.preview.map((row) => row.join(',')).join('\n'),
      }
    }
    return fetchMock(comp.type)
  }

  async function fetchApi(comp) {
    const ds = comp?.data?.config?.dataSource || {}
    if (!ds.apiUrl) return fetchMock(comp.type)

    const headers = parseJsonObject(ds.apiHeaders)
    const options = {
      method: ds.apiMethod || 'GET',
      headers: { 'Content-Type': 'application/json', ...headers },
    }
    if (options.method === 'POST' && ds.requestBody) options.body = ds.requestBody

    const response = await fetch(ds.apiUrl, options)
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    const raw = await response.json()
    const result = getByPath(raw, ds.apiDataPath) ?? raw
    return result && typeof result === 'object' ? result : fetchMock(comp.type)
  }

  async function refresh() {
    const comp = getComponent(componentRef)
    if (!comp?.type) return

    loading.value = true
    error.value = null

    try {
      const sourceType = comp.data?.config?.dataSource?.type || 'mock'
      if (sourceType === 'api') data.value = await fetchApi(comp)
      else if (sourceType === 'static') data.value = fetchStatic(comp)
      else if (sourceType === 'dataset') data.value = fetchDataset(comp)
      else data.value = fetchMock(comp.type)
      lastRefreshTime.value = new Date().toISOString()
    } catch (err) {
      error.value = err.message || '数据获取失败'
      data.value = fetchMock(comp.type)
    } finally {
      loading.value = false
    }
  }

  function stopPolling() {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
  }

  function startPolling(intervalSec) {
    stopPolling()
    if (!intervalSec || intervalSec <= 0) return
    pollingTimer = setInterval(refresh, intervalSec * 1000)
  }

  function setupAutoPolling() {
    const comp = getComponent(componentRef)
    startPolling(Number(comp?.data?.config?.dataSource?.refreshInterval || 0))
  }

  if (componentRef?.value !== undefined) {
    watch(
      () => [
        componentRef.value?.id,
        componentRef.value?.data?.config?.dataSource?.type,
        componentRef.value?.data?.config?.dataSource?.datasetId,
        componentRef.value?.data?.config?.dataSource?.refreshInterval,
      ],
      () => {
        refresh()
        setupAutoPolling()
      },
      { immediate: false }
    )
  }

  refresh()
  setupAutoPolling()

  onUnmounted(stopPolling)

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

export class DataSourceAdapter {
  async fetch() {
    throw new Error('Not implemented')
  }

  transform(rawData) {
    return rawData
  }
}
