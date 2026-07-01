<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import NodePanel from '../components/NodePanel.vue'
import FlowCanvas from '../components/FlowCanvas.vue'
import ConfigPanel from '../components/ConfigPanel.vue'
import { useWorkflow } from '../composables/useWorkflow.js'
import { useKeyboard } from '../composables/useKeyboard.js'
import { WORKFLOW_TEMPLATES } from '../config/workflowTemplates.js'

const router = useRouter()
const route = useRoute()
const {
  nodes, edges, removeNode, selectedNodeId, selectedNode,
  exportWorkflow, importWorkflow, clearCanvas, loadWorkflow, getWorkflowSnapshot
} = useWorkflow()

const workflowName = ref('未命名工作流')
const workflowId = ref(null)
const STORAGE_KEY = 'bigdata_agent_flow_workflows'

// Load workflow on mount
onMounted(() => {
  const id = route.params.id
  if (!id) { router.push('/workflows'); return }
  workflowId.value = id

  // First check localStorage for saved data
  const currentData = localStorage.getItem('bigdata_agent_flow_current_workflow')
  if (currentData) {
    try {
      const parsed = JSON.parse(currentData)
      if (parsed.id === id) {
        loadWorkflow(parsed)
        workflowName.value = parsed.name || '未命名工作流'
        return
      }
    } catch { /* ignore */ }
  }

  // Check if it's a template
  const template = WORKFLOW_TEMPLATES.find((t) => t.id === id)
  if (template) {
    loadWorkflow(template)
    workflowName.value = template.name
    return
  }

  // Check user workflows in localStorage
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const found = saved.find((w) => w.id === id)
    if (found) {
      loadWorkflow(found)
      workflowName.value = found.name
      return
    }
  } catch { /* ignore */ }

  // Not found — start empty
  workflowName.value = '新建工作流'
})

// Save workflow before leaving
function saveCurrentWorkflow() {
  if (!workflowId.value) return
  const snapshot = getWorkflowSnapshot()
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const idx = saved.findIndex((w) => w.id === workflowId.value)
    const now = new Date().toISOString()
    const data = {
      id: workflowId.value,
      name: workflowName.value,
      description: '',
      category: '通用',
      icon: '⚡',
      nodeCount: snapshot.nodes.length,
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      updatedAt: now,
    }
    if (idx >= 0) {
      saved[idx] = { ...saved[idx], ...data }
    } else {
      // Don't auto-add new empty workflows
      if (snapshot.nodes.length > 0) {
        data.createdAt = data.createdAt || now
        saved.push(data)
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  } catch { /* ignore */ }
}

onUnmounted(() => {
  saveCurrentWorkflow()
})

// Keyboard
useKeyboard({
  onDelete: () => {
    if (selectedNodeId.value) {
      removeNode(selectedNodeId.value)
    }
  },
  onSave: () => {
    saveCurrentWorkflow()
    const json = exportWorkflow()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workflowName.value || 'workflow'}-${Date.now()}.json`
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
      <button class="back-link" @click="saveCurrentWorkflow(); router.push('/workflows')">
        <span class="back-arrow">←</span>
        <span>工作流列表</span>
      </button>
      <span class="back-divider">|</span>
      <span class="back-title">{{ workflowName }}</span>
      <span class="back-divider">|</span>
      <span class="back-meta">{{ nodes.length }} 节点 · {{ edges.length }} 连线</span>
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

.back-meta {
  font-size: 11px;
  color: #94a3b8;
  font-family: monospace;
}

/* Editor main area */
.editor-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
