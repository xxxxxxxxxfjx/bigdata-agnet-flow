<script setup>
import { ref, markRaw } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import CustomNode from './nodes/CustomNode.vue'
import { useWorkflow } from '../composables/useWorkflow.js'

const {
  nodes,
  edges,
  addNode,
  addEdge,
  selectNode,
  deselectNode,
  removeNode,
  removeEdge,
  clearCanvas,
  exportWorkflow,
  importWorkflow,
} = useWorkflow()

const nodeTypes = {
  custom: markRaw(CustomNode),
}

const { onConnect, project } = useVueFlow()

const vueFlowRef = ref(null)

onConnect((connection) => {
  addEdge(connection)
})

function onDrop(event) {
  const type = event.dataTransfer?.getData('application/vueflow-node-type')
  if (!type) return

  const bounds = vueFlowRef.value?.$el?.getBoundingClientRect()
  if (!bounds) return

  const position = project({
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
  })

  addNode(type, position)
}

function onDragOver(event) {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

function onNodeClick(event) {
  selectNode(event.node.id)
}

function onPaneClick() {
  deselectNode()
}

function onEdgeDoubleClick(event) {
  removeEdge(event.edge.id)
}

function handleExport() {
  const json = exportWorkflow()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `workflow-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      importWorkflow(ev.target.result)
    }
    reader.readAsText(file)
  }
  input.click()
}
</script>

<template>
  <div class="flow-canvas">
    <div class="canvas-toolbar">
      <button class="toolbar-btn" @click="handleImport" title="导入工作流">
        <span class="btn-icon">📂</span> 导入
      </button>
      <button class="toolbar-btn" @click="handleExport" title="导出工作流">
        <span class="btn-icon">💾</span> 导出
      </button>
      <button class="toolbar-btn danger" @click="clearCanvas" title="清空画布">
        <span class="btn-icon">🗑️</span> 清空
      </button>
    </div>

    <VueFlow
      ref="vueFlowRef"
      v-model:nodes="nodes"
      v-model:edges="edges"
      :node-types="nodeTypes"
      :default-viewport="{ zoom: 1 }"
      :min-zoom="0.2"
      :max-zoom="4"
      class="vue-flow-wrapper"
      @drop="onDrop"
      @dragover="onDragOver"
      @node-click="onNodeClick"
      @pane-click="onPaneClick"
      @edge-double-click="onEdgeDoubleClick"
    >
      <Background variant="lines" pattern-color="#94a3b8" :gap="20" :size="1" />
      <Controls />
      <MiniMap
        pannable
        zoomable
        :width="240"
        :height="180"
        :node-color="(n) => n.data?.color || '#6366f1'"
        mask-color="rgba(99, 102, 241, 0.2)"
        mask-stroke-color="#6366f1"
        :mask-stroke-width="3"
        :mask-border-radius="6"
      />

      <template #node-custom="nodeProps">
        <CustomNode v-bind="nodeProps" />
      </template>
    </VueFlow>
  </div>
</template>

<style scoped>
.flow-canvas {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  /* Graph-paper background */
  background-color: #fafbfc;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.18) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.18) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: -1px -1px;
  /* Bold border */
  border: 3px solid #c7d2fe;
  border-radius: 14px;
  margin: 10px;
  overflow: hidden;
  box-shadow:
    inset 0 0 0 1px rgba(99, 102, 241, 0.1),
    0 4px 16px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(0, 0, 0, 0.04);
}

/* Top accent line */
.flow-canvas::before {
  content: '';
  position: absolute;
  top: 0;
  left: 12px;
  right: 12px;
  height: 3px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa);
  border-radius: 0 0 4px 4px;
  pointer-events: none;
  z-index: 20;
}

/* Corner accents */
.flow-canvas::after {
  content: '';
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  bottom: 8px;
  border: 1.5px dashed rgba(99, 102, 241, 0.25);
  border-radius: 8px;
  pointer-events: none;
  z-index: 0;
}

.canvas-toolbar {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 10;
  display: flex;
  gap: 8px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.toolbar-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.toolbar-btn.danger:hover {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #dc2626;
}

.btn-icon {
  font-size: 14px;
}

.vue-flow-wrapper {
  flex: 1;
}
</style>
