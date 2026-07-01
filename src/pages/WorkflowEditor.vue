<script setup>
import { useRouter } from 'vue-router'
import NodePanel from '../components/NodePanel.vue'
import FlowCanvas from '../components/FlowCanvas.vue'
import ConfigPanel from '../components/ConfigPanel.vue'
import { useWorkflow } from '../composables/useWorkflow.js'
import { useKeyboard } from '../composables/useKeyboard.js'

const router = useRouter()
const { removeNode, selectedNodeId, selectedNode, exportWorkflow, importWorkflow, clearCanvas } = useWorkflow()

useKeyboard({
  onDelete: () => {
    if (selectedNodeId.value) {
      removeNode(selectedNodeId.value)
    }
  },
  onSave: () => {
    const json = exportWorkflow()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workflow-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  },
  onEscape: () => {
    if (selectedNodeId.value) {
      selectedNodeId.value = null
    }
  },
})
</script>

<template>
  <div class="workflow-editor">
    <!-- Back link -->
    <div class="back-bar">
      <button class="back-link" @click="router.push('/')">
        <span class="back-arrow">←</span>
        <span>返回首页</span>
      </button>
      <span class="back-divider">|</span>
      <span class="back-title">工作流编排</span>
    </div>
    <div class="editor-main">
      <NodePanel />
      <FlowCanvas />
      <ConfigPanel />
    </div>
  </div>
</template>

<style scoped>
.workflow-editor {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

/* Back bar */
.back-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  height: 36px;
  background: #fafbfc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  color: #6366f1;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s;
}

.back-link:hover {
  background: #eef2ff;
}

.back-arrow {
  font-size: 14px;
}

.back-divider {
  color: #e2e8f0;
  font-size: 14px;
}

.back-title {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

/* Editor main area */
.editor-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
