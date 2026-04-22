<script setup>
import { ref } from 'vue'
import { NODE_CATEGORIES, NODE_TYPE_CONFIG } from '../config/nodeTypes.js'

const expandedCategories = ref(NODE_CATEGORIES.map((c) => c.key))

function toggleCategory(key) {
  const idx = expandedCategories.value.indexOf(key)
  if (idx >= 0) {
    expandedCategories.value.splice(idx, 1)
  } else {
    expandedCategories.value.push(key)
  }
}

function onDragStart(event, type) {
  event.dataTransfer.setData('application/vueflow-node-type', type)
  event.dataTransfer.effectAllowed = 'move'
}
</script>

<template>
  <aside class="node-panel">
    <div class="panel-header">
      <h2>节点类型</h2>
      <span class="panel-subtitle">拖拽到画布添加节点</span>
    </div>

    <div class="panel-body">
      <div
        v-for="category in NODE_CATEGORIES"
        :key="category.key"
        class="category"
      >
        <div
          class="category-header"
          @click="toggleCategory(category.key)"
        >
          <span class="category-arrow" :class="{ expanded: expandedCategories.includes(category.key) }">
            ▶
          </span>
          <span class="category-label">{{ category.label }}</span>
          <span class="category-count">{{ category.nodes.length }}</span>
        </div>

        <transition name="collapse">
          <div
            v-if="expandedCategories.includes(category.key)"
            class="category-nodes"
          >
            <div
              v-for="nodeKey in category.nodes"
              :key="nodeKey"
              class="node-item"
              :style="{ '--item-color': NODE_TYPE_CONFIG[nodeKey]?.color }"
              draggable="true"
              @dragstart="onDragStart($event, nodeKey)"
            >
              <span class="node-item-icon">{{ NODE_TYPE_CONFIG[nodeKey]?.icon }}</span>
              <div class="node-item-info">
                <span class="node-item-label">{{ NODE_TYPE_CONFIG[nodeKey]?.label }}</span>
                <span class="node-item-desc">{{ NODE_TYPE_CONFIG[nodeKey]?.description }}</span>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.node-panel {
  width: 260px;
  min-width: 260px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  padding: 20px 18px 14px;
  border-bottom: 1px solid #f1f5f9;
}

.panel-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.panel-subtitle {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
  display: block;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px 16px;
}

.category {
  margin-bottom: 4px;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s;
  user-select: none;
}

.category-header:hover {
  background: #f8fafc;
}

.category-arrow {
  font-size: 10px;
  color: #94a3b8;
  transition: transform 0.2s ease;
}

.category-arrow.expanded {
  transform: rotate(90deg);
}

.category-label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  flex: 1;
}

.category-count {
  font-size: 11px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 1px 7px;
  border-radius: 10px;
}

.category-nodes {
  padding: 0 0 4px 6px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 4px;
  border-radius: 10px;
  cursor: grab;
  border: 1.5px solid #f1f5f9;
  background: #fafbfc;
  transition: all 0.2s ease;
}

.node-item:hover {
  border-color: var(--item-color);
  background: color-mix(in srgb, var(--item-color) 5%, white);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transform: translateX(2px);
}

.node-item:active {
  cursor: grabbing;
  transform: scale(0.97);
}

.node-item-icon {
  font-size: 22px;
  line-height: 1;
  flex-shrink: 0;
}

.node-item-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.node-item-label {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
}

.node-item-desc {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.2s ease;
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
  max-height: 500px;
}
</style>
