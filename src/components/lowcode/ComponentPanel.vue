<script setup>
import { computed, ref, watch } from 'vue'
import { CHART_CATEGORIES, CHART_TYPE_CONFIG } from '../../config/chartTypes.js'

const searchQuery = ref('')
const expandedCategories = ref(CHART_CATEGORIES.map((c) => c.key))

const filteredCategories = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return CHART_CATEGORIES.map((category) => {
    const filteredNodes = category.nodes.filter((key) => {
      const cfg = CHART_TYPE_CONFIG[key]
      if (!cfg) return false
      if (!q) return true
      return [cfg.label, cfg.description, key].join(' ').toLowerCase().includes(q)
    })
    return { ...category, filteredNodes }
  }).filter((category) => category.filteredNodes.length > 0)
})

watch(searchQuery, (q) => {
  if (q.trim()) expandedCategories.value = filteredCategories.value.map((c) => c.key)
})

function toggleCategory(key) {
  if (expandedCategories.value.includes(key)) {
    expandedCategories.value = expandedCategories.value.filter((item) => item !== key)
  } else {
    expandedCategories.value = [...expandedCategories.value, key]
  }
}

function onDragStart(event, type) {
  event.dataTransfer.setData('application/lowcode-component-type', type)
  event.dataTransfer.effectAllowed = 'move'
}
</script>

<template>
  <aside class="component-panel">
    <header class="panel-header">
      <div>
        <h2>组件库</h2>
        <p>拖拽组件到画布</p>
      </div>
      <div class="panel-search">
        <input v-model="searchQuery" type="text" placeholder="搜索图表、指标、装饰" />
        <button v-if="searchQuery" @click="searchQuery = ''">×</button>
      </div>
    </header>

    <div class="panel-body">
      <div v-if="filteredCategories.length === 0" class="empty">没有匹配的组件</div>

      <section v-for="category in filteredCategories" :key="category.key" class="category">
        <button class="category-header" @click="toggleCategory(category.key)">
          <span class="arrow" :class="{ expanded: expandedCategories.includes(category.key) }">›</span>
          <strong>{{ category.label }}</strong>
          <em>{{ category.filteredNodes.length }}</em>
        </button>

        <transition name="collapse">
          <div v-if="expandedCategories.includes(category.key)" class="node-list">
            <div
              v-for="nodeKey in category.filteredNodes"
              :key="nodeKey"
              class="node-item"
              :style="{ '--item-color': CHART_TYPE_CONFIG[nodeKey]?.color }"
              draggable="true"
              @dragstart="onDragStart($event, nodeKey)"
            >
              <span class="node-icon">{{ CHART_TYPE_CONFIG[nodeKey]?.icon }}</span>
              <span class="node-info">
                <strong>{{ CHART_TYPE_CONFIG[nodeKey]?.label }}</strong>
                <small>{{ CHART_TYPE_CONFIG[nodeKey]?.description }}</small>
              </span>
            </div>
          </div>
        </transition>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.component-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border-right: 1px solid #dbe3ef;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e5edf7;
}

.panel-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
}

.panel-header p {
  margin: 4px 0 12px;
  color: #64748b;
  font-size: 12px;
}

.panel-search {
  position: relative;
}

.panel-search input {
  width: 100%;
  height: 34px;
  padding: 0 34px 0 10px;
  border: 1px solid #dbe3ef;
  border-radius: 6px;
  color: #0f172a;
  outline: none;
}

.panel-search input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.panel-search button {
  position: absolute;
  right: 6px;
  top: 6px;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 4px;
  color: #64748b;
  background: #f1f5f9;
  cursor: pointer;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px 16px;
}

.empty {
  padding: 24px 0;
  color: #94a3b8;
  text-align: center;
  font-size: 13px;
}

.category {
  margin-bottom: 6px;
}

.category-header {
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  border: 0;
  border-radius: 6px;
  color: #334155;
  background: transparent;
  cursor: pointer;
}

.category-header:hover {
  background: #f8fafc;
}

.category-header strong {
  flex: 1;
  font-size: 13px;
  text-align: left;
}

.category-header em {
  padding: 1px 7px;
  border-radius: 999px;
  color: #64748b;
  background: #eef2f7;
  font-size: 11px;
  font-style: normal;
}

.arrow {
  color: #64748b;
  font-size: 16px;
  transition: transform 0.18s ease;
}

.arrow.expanded {
  transform: rotate(90deg);
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 2px 0 6px 8px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 58px;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  cursor: grab;
  transition: all 0.16s ease;
}

.node-item:hover {
  border-color: var(--item-color);
  background: color-mix(in srgb, var(--item-color) 6%, white);
  transform: translateX(2px);
}

.node-item:active {
  cursor: grabbing;
}

.node-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 6px;
  color: var(--item-color);
  background: color-mix(in srgb, var(--item-color) 10%, white);
  font-weight: 900;
}

.node-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.node-info strong {
  color: #0f172a;
  font-size: 13px;
}

.node-info small {
  overflow: hidden;
  color: #64748b;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.18s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 900px;
}
</style>
