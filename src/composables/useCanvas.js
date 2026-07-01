import { ref, computed } from 'vue'
import { getDefaultChartData, CHART_TYPE_CONFIG } from '../config/chartTypes.js'

let idCounter = 0
function generateId() {
  return `comp_${Date.now()}_${++idCounter}`
}

// Module-level singleton state
const components = ref([])
const selectedId = ref(null)
const selectedIds = ref([]) // Multi-select support
const clipboard = ref([])   // Copy/paste clipboard
const canvasStyle = ref({
  width: 1920,
  height: 1080,
  background: '#0f172a',
  scaleMode: 'full',
  gridSize: 10,
  showGrid: true,
})

const selectedComponent = computed(() => {
  if (!selectedId.value) return null
  return components.value.find((c) => c.id === selectedId.value) || null
})

const selectedComponentTypeConfig = computed(() => {
  if (!selectedComponent.value) return null
  return CHART_TYPE_CONFIG[selectedComponent.value.type] || null
})

export function useCanvas() {
  function addComponent(type, x, y) {
    const id = generateId()
    const data = getDefaultChartData(type)
    const component = {
      id,
      type,
      x: Math.round(x),
      y: Math.round(y),
      w: data.size.w,
      h: data.size.h,
      zIndex: components.value.length + 1,
      visible: true,
      locked: false,
      data,
    }
    components.value = [...components.value, component]
    selectedId.value = id
    return component
  }

  function removeComponent(id) {
    components.value = components.value.filter((c) => c.id !== id)
    if (selectedId.value === id) {
      selectedId.value = null
    }
  }

  function selectComponent(id, multi = false) {
    if (multi) {
      // Toggle in multi-select
      const idx = selectedIds.value.indexOf(id)
      if (idx >= 0) {
        selectedIds.value = selectedIds.value.filter((i) => i !== id)
      } else {
        selectedIds.value = [...selectedIds.value, id]
      }
      selectedId.value = selectedIds.value.length > 0 ? selectedIds.value[selectedIds.value.length - 1] : null
    } else {
      selectedId.value = id
      selectedIds.value = id ? [id] : []
    }
  }

  function deselectComponent() {
    selectedId.value = null
    selectedIds.value = []
  }

  function selectAll() {
    selectedIds.value = components.value.map((c) => c.id)
    selectedId.value = selectedIds.value.length > 0 ? selectedIds.value[0] : null
  }

  function selectInRect(rect) {
    // rect: { x, y, w, h }
    const hits = components.value.filter((c) => {
      return (
        c.x < rect.x + rect.w &&
        c.x + c.w > rect.x &&
        c.y < rect.y + rect.h &&
        c.y + c.h > rect.y
      )
    })
    selectedIds.value = hits.map((c) => c.id)
    selectedId.value = selectedIds.value.length > 0 ? selectedIds.value[0] : null
  }

  // Clipboard operations
  function copyToClipboard(ids) {
    const idsToCopy = ids || selectedIds.value
    clipboard.value = components.value
      .filter((c) => idsToCopy.includes(c.id))
      .map((c) => JSON.parse(JSON.stringify(c)))
  }

  function pasteFromClipboard() {
    if (clipboard.value.length === 0) return []
    const newIds = []
    clipboard.value.forEach((comp) => {
      const newId = generateId()
      const newComp = {
        ...comp,
        id: newId,
        x: comp.x + 30,
        y: comp.y + 30,
        zIndex: components.value.length + 1,
      }
      components.value = [...components.value, newComp]
      newIds.push(newId)
    })
    selectedIds.value = newIds
    selectedId.value = newIds.length > 0 ? newIds[0] : null
    // Update clipboard offsets for repeated paste
    clipboard.value = clipboard.value.map((c) => ({ ...c, x: c.x + 30, y: c.y + 30 }))
    return newIds
  }

  // Multi-component operations
  function deleteSelected() {
    const ids = [...selectedIds.value]
    components.value = components.value.filter((c) => !ids.includes(c.id))
    selectedId.value = null
    selectedIds.value = []
  }

  function moveSelectedComponents(dx, dy) {
    selectedIds.value.forEach((id) => {
      const comp = components.value.find((c) => c.id === id)
      if (comp) {
        comp.x = Math.round(comp.x + dx)
        comp.y = Math.round(comp.y + dy)
      }
    })
  }

  function updatePosition(id, x, y) {
    const comp = components.value.find((c) => c.id === id)
    if (comp) {
      comp.x = Math.round(x)
      comp.y = Math.round(y)
    }
  }

  function updateSize(id, w, h) {
    const comp = components.value.find((c) => c.id === id)
    if (comp) {
      comp.w = Math.max(50, Math.round(w))
      comp.h = Math.max(50, Math.round(h))
    }
  }

  function updateComponentConfig(id, key, value) {
    const comp = components.value.find((c) => c.id === id)
    if (comp && comp.data) {
      comp.data = {
        ...comp.data,
        config: {
          ...comp.data.config,
          [key]: value,
        },
      }
    }
  }

  function updateComponentStyle(id, key, value) {
    const comp = components.value.find((c) => c.id === id)
    if (comp && comp.data) {
      comp.data = {
        ...comp.data,
        style: {
          ...comp.data.style,
          [key]: value,
        },
      }
    }
  }

  function updateComponentDataSource(id, dataSourceConfig) {
    const comp = components.value.find((c) => c.id === id)
    if (comp && comp.data && comp.data.config) {
      comp.data = {
        ...comp.data,
        config: {
          ...comp.data.config,
          dataSource: {
            ...comp.data.config.dataSource,
            ...dataSourceConfig,
          },
        },
      }
    }
  }

  function updateComponentMockData(id, mockDataUpdates) {
    const comp = components.value.find((c) => c.id === id)
    if (comp && comp.data && comp.data.config) {
      comp.data = {
        ...comp.data,
        config: {
          ...comp.data.config,
          ...mockDataUpdates,
        },
      }
    }
  }

  function duplicateComponent(id) {
    const comp = components.value.find((c) => c.id === id)
    if (!comp) return null
    const newId = generateId()
    const newComp = {
      ...JSON.parse(JSON.stringify(comp)),
      id: newId,
      x: comp.x + 30,
      y: comp.y + 30,
      zIndex: components.value.length + 1,
    }
    components.value = [...components.value, newComp]
    selectedId.value = newId
    return newComp
  }

  function updateCanvasStyle(key, value) {
    canvasStyle.value = { ...canvasStyle.value, [key]: value }
  }

  function bringToFront(id) {
    const maxZ = Math.max(...components.value.map((c) => c.zIndex), 0)
    const comp = components.value.find((c) => c.id === id)
    if (comp) {
      comp.zIndex = maxZ + 1
    }
  }

  function sendToBack(id) {
    const minZ = Math.min(...components.value.map((c) => c.zIndex), 0)
    const comp = components.value.find((c) => c.id === id)
    if (comp) {
      comp.zIndex = minZ - 1
    }
  }

  function moveUp(id) {
    const comp = components.value.find((c) => c.id === id)
    if (comp) {
      comp.zIndex += 1
    }
  }

  function moveDown(id) {
    const comp = components.value.find((c) => c.id === id)
    if (comp) {
      comp.zIndex -= 1
    }
  }

  function clearCanvas() {
    components.value = []
    selectedId.value = null
  }

  function exportCanvas() {
    return JSON.stringify(
      {
        components: components.value,
        canvasStyle: canvasStyle.value,
        version: '1.0',
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    )
  }

  function importCanvas(jsonStr) {
    try {
      const data = JSON.parse(jsonStr)
      if (data.components && data.canvasStyle) {
        components.value = data.components
        canvasStyle.value = { ...canvasStyle.value, ...data.canvasStyle }
        selectedId.value = null
        return true
      }
      return false
    } catch {
      return false
    }
  }

  return {
    // State
    components,
    selectedId,
    selectedIds,
    clipboard,
    canvasStyle,
    selectedComponent,
    selectedComponentTypeConfig,

    // Component mutations
    addComponent,
    removeComponent,
    selectComponent,
    deselectComponent,
    selectAll,
    selectInRect,
    updatePosition,
    updateSize,
    updateComponentConfig,
    updateComponentStyle,
    updateComponentDataSource,
    updateComponentMockData,
    duplicateComponent,

    // Clipboard
    copyToClipboard,
    pasteFromClipboard,

    // Multi-component
    deleteSelected,
    moveSelectedComponents,

    // Layer operations
    bringToFront,
    sendToBack,
    moveUp,
    moveDown,

    // Canvas operations
    clearCanvas,
    exportCanvas,
    importCanvas,
    updateCanvasStyle,
  }
}
