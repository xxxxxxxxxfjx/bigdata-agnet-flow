import { ref, computed } from 'vue'
import { getDefaultNodeData, NODE_TYPE_CONFIG } from '../config/nodeTypes.js'

let idCounter = 0
function generateId() {
  return `node_${Date.now()}_${++idCounter}`
}

const nodes = ref([])
const edges = ref([])
const selectedNodeId = ref(null)

const selectedNode = computed(() => {
  if (!selectedNodeId.value) return null
  return nodes.value.find((n) => n.id === selectedNodeId.value) || null
})

const selectedNodeTypeConfig = computed(() => {
  if (!selectedNode.value) return null
  return NODE_TYPE_CONFIG[selectedNode.value.data.type] || null
})

export function useWorkflow() {
  function addNode(type, position = { x: 300, y: 200 }) {
    const id = generateId()
    const data = getDefaultNodeData(type)
    const node = {
      id,
      type: 'custom',
      position: { ...position },
      data,
    }
    nodes.value = [...nodes.value, node]
    return node
  }

  function removeNode(nodeId) {
    nodes.value = nodes.value.filter((n) => n.id !== nodeId)
    edges.value = edges.value.filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    )
    if (selectedNodeId.value === nodeId) {
      selectedNodeId.value = null
    }
  }

  function selectNode(nodeId) {
    selectedNodeId.value = nodeId
  }

  function deselectNode() {
    selectedNodeId.value = null
  }

  function updateNodeConfig(nodeId, key, value) {
    const node = nodes.value.find((n) => n.id === nodeId)
    if (node) {
      node.data = {
        ...node.data,
        config: {
          ...node.data.config,
          [key]: value,
        },
      }
    }
  }

  function updateNodeLabel(nodeId, label) {
    const node = nodes.value.find((n) => n.id === nodeId)
    if (node) {
      node.data = { ...node.data, label }
    }
  }

  function addEdge(edge) {
    const exists = edges.value.find(
      (e) => e.source === edge.source && e.target === edge.target &&
        e.sourceHandle === edge.sourceHandle && e.targetHandle === edge.targetHandle
    )
    if (!exists) {
      edges.value = [
        ...edges.value,
        {
          ...edge,
          id: `e-${edge.source}-${edge.target}-${Date.now()}`,
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
        },
      ]
    }
  }

  function removeEdge(edgeId) {
    edges.value = edges.value.filter((e) => e.id !== edgeId)
  }

  function clearCanvas() {
    nodes.value = []
    edges.value = []
    selectedNodeId.value = null
  }

  function exportWorkflow() {
    return JSON.stringify(
      {
        nodes: nodes.value,
        edges: edges.value,
        version: '1.0',
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    )
  }

  function importWorkflow(jsonStr) {
    try {
      const data = JSON.parse(jsonStr)
      if (data.nodes && data.edges) {
        nodes.value = data.nodes
        edges.value = data.edges
        selectedNodeId.value = null
        return true
      }
      return false
    } catch {
      return false
    }
  }

  return {
    nodes,
    edges,
    selectedNodeId,
    selectedNode,
    selectedNodeTypeConfig,
    addNode,
    removeNode,
    selectNode,
    deselectNode,
    updateNodeConfig,
    updateNodeLabel,
    addEdge,
    removeEdge,
    clearCanvas,
    exportWorkflow,
    importWorkflow,
  }
}
