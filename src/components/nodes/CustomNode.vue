<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'

const props = defineProps({
  id: String,
  data: Object,
  selected: Boolean,
})

const nodeStyle = computed(() => ({
  '--node-color': props.data?.color || '#6366f1',
}))

const inputHandles = computed(() => {
  const count = props.data?.handles?.inputs || 0
  return Array.from({ length: count }, (_, i) => ({
    id: `input-${i}`,
    position: Position.Left,
    style: {
      top: count === 1 ? '50%' : `${((i + 1) / (count + 1)) * 100}%`,
    },
  }))
})

const outputHandles = computed(() => {
  const count = props.data?.handles?.outputs || 0
  const labels = props.data?.outputLabels || []
  return Array.from({ length: count }, (_, i) => ({
    id: `output-${i}`,
    position: Position.Right,
    label: labels[i] || '',
    style: {
      top: count === 1 ? '50%' : `${((i + 1) / (count + 1)) * 100}%`,
    },
  }))
})
</script>

<template>
  <div
    class="custom-node"
    :class="{ selected }"
    :style="nodeStyle"
  >
    <div class="node-header">
      <span class="node-icon">{{ data?.icon }}</span>
      <span class="node-title">{{ data?.label }}</span>
    </div>
    <div class="node-body">
      <span class="node-desc">{{ data?.description }}</span>
    </div>

    <Handle
      v-for="handle in inputHandles"
      :key="handle.id"
      :id="handle.id"
      type="target"
      :position="handle.position"
      :style="handle.style"
      class="handle handle-input"
    />

    <Handle
      v-for="handle in outputHandles"
      :key="handle.id"
      :id="handle.id"
      type="source"
      :position="handle.position"
      :style="handle.style"
      class="handle handle-output"
    />

    <template v-for="handle in outputHandles" :key="'label-' + handle.id">
      <div
        v-if="handle.label"
        class="handle-label"
        :style="{ top: handle.style.top }"
      >
        {{ handle.label }}
      </div>
    </template>
  </div>
</template>

<style scoped>
.custom-node {
  background: #ffffff;
  border: 2px solid var(--node-color);
  border-radius: 12px;
  min-width: 180px;
  max-width: 220px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  cursor: grab;
  overflow: visible;
}

.custom-node:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.custom-node.selected {
  border-color: var(--node-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--node-color) 25%, transparent);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: color-mix(in srgb, var(--node-color) 10%, white);
  border-radius: 10px 10px 0 0;
  border-bottom: 1px solid color-mix(in srgb, var(--node-color) 15%, transparent);
}

.node-icon {
  font-size: 18px;
  line-height: 1;
}

.node-title {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-body {
  padding: 8px 14px 10px;
}

.node-desc {
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.handle {
  width: 12px !important;
  height: 12px !important;
  border: 2px solid var(--node-color) !important;
  background: #fff !important;
  transition: all 0.15s ease;
}

.handle:hover {
  background: var(--node-color) !important;
  transform: scale(1.3);
}

.handle-label {
  position: absolute;
  right: -45px;
  transform: translateY(-50%);
  font-size: 10px;
  color: #64748b;
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 4px;
  pointer-events: none;
}
</style>
