<script setup>
import { ref, computed, toRef } from 'vue'
import ChartRenderer from './ChartRenderer.vue'
import { useDataBinding } from '../../composables/useDataBinding.js'

const props = defineProps({
  component: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  scale: { type: Number, default: 1 },
})

const emit = defineEmits(['select', 'update-position', 'update-size', 'update-bounds', 'delete', 'mutation', 'drag-end', 'contextmenu'])

// Wire data binding to ChartRenderer
const componentRef = toRef(props, 'component')
const { data: boundData, loading: dataLoading } = useDataBinding(componentRef)

// Drag state
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const compStart = ref({ x: 0, y: 0 })

// Resize state
const isResizing = ref(false)
const resizeHandle = ref('')
const resizeStart = ref({ x: 0, y: 0, w: 0, h: 0, mx: 0, my: 0 })

// Grid snap
const GRID = 10

function snap(val) {
  return Math.round(val / GRID) * GRID
}

// --- Drag ---
function onHeaderMouseDown(e) {
  if (props.component.locked) return
  e.preventDefault()
  e.stopPropagation()

  isDragging.value = true
  dragStart.value = { x: e.clientX, y: e.clientY }
  compStart.value = { x: props.component.x, y: props.component.y }

  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e) {
  if (!isDragging.value) return
  const dx = (e.clientX - dragStart.value.x) / props.scale
  const dy = (e.clientY - dragStart.value.y) / props.scale

  emit('update-position', props.component.id, snap(compStart.value.x + dx), snap(compStart.value.y + dy))
}

function onDragEnd() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  emit('drag-end')
  emit('mutation')
}

// --- Resize ---
const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

function onResizeMouseDown(e, handle) {
  e.preventDefault()
  e.stopPropagation()

  isResizing.value = true
  resizeHandle.value = handle
  resizeStart.value = {
    x: props.component.x,
    y: props.component.y,
    w: props.component.w,
    h: props.component.h,
    mx: e.clientX,
    my: e.clientY,
  }

  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', onResizeEnd)
}

function onResizeMove(e) {
  if (!isResizing.value) return

  const dx = (e.clientX - resizeStart.value.mx) / props.scale
  const dy = (e.clientY - resizeStart.value.my) / props.scale
  const h = resizeHandle.value
  let { x, y, w, h: newH } = resizeStart.value

  if (h.includes('e')) w += dx
  if (h.includes('w')) { x += dx; w -= dx }
  if (h.includes('s')) newH += dy
  if (h.includes('n')) { y += dy; newH -= dy }

  // Minimum size
  w = Math.max(50, w)
  newH = Math.max(50, newH)

  // Atomic position+size update — fixes jitter on corner resizes
  emit('update-bounds', props.component.id, snap(x), snap(y), snap(w), snap(newH))
}

function onResizeEnd() {
  isResizing.value = false
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
  emit('mutation')
}

// --- Click ---
function onClick(e) {
  e.stopPropagation()
  emit('select', props.component.id, e)
}

function onContextMenu(e) {
  emit('contextmenu', props.component.id, e)
}

function onDelete(e) {
  e.stopPropagation()
  emit('delete', props.component.id)
}
</script>

<template>
  <div
    class="shape-wrapper"
    :class="{ selected, dragging: isDragging, resizing: isResizing }"
    :style="{
      position: 'absolute',
      left: component.x + 'px',
      top: component.y + 'px',
      width: component.w + 'px',
      height: component.h + 'px',
      zIndex: component.zIndex || 1,
      opacity: component.data?.style?.opacity ?? 1,
      borderRadius: (component.data?.style?.borderRadius || 0) + 'px',
      boxShadow: component.data?.style?.boxShadow || 'none',
    }"
    @click="onClick"
    @contextmenu="onContextMenu"
  >
    <!-- Component Content -->
    <div class="shape-content" :style="{ width: component.w + 'px', height: component.h + 'px' }">
      <ChartRenderer
        :type="component.type"
        :config="component.data?.config || {}"
        :width="component.w"
        :height="component.h"
        :external-data="boundData"
        :loading="dataLoading"
      />
    </div>

    <!-- Drag header (visible on selected) -->
    <div
      v-if="selected && !component.locked"
      class="shape-header"
      @mousedown="onHeaderMouseDown"
    >
      <span class="shape-label">{{ component.data?.label || component.type }}</span>
      <button class="shape-delete-btn" @click="onDelete" title="删除">×</button>
    </div>

    <!-- Resize handles -->
    <template v-if="selected && !component.locked">
      <div
        v-for="handle in handles"
        :key="handle"
        class="resize-handle"
        :class="'handle-' + handle"
        @mousedown="onResizeMouseDown($event, handle)"
      ></div>
    </template>

    <!-- Locked indicator -->
    <div v-if="component.locked" class="lock-overlay" title="已锁定">
      <span>🔒</span>
    </div>

    <!-- Selection border -->
    <div v-if="selected" class="selection-border"></div>
  </div>
</template>

<style scoped>
.shape-wrapper {
  cursor: pointer;
  transition: box-shadow 0.15s;
  animation: shape-enter 0.3s ease-out;
}

@keyframes shape-enter {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.shape-wrapper:hover {
  box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.2);
}

.shape-wrapper.selected {
  box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.6);
}

.shape-wrapper.dragging {
  cursor: grabbing;
  opacity: 0.9;
}

.shape-content {
  position: relative;
  overflow: hidden;
}

/* Lock overlay */
.lock-overlay {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 12px;
  opacity: 0.6;
  z-index: 9;
  pointer-events: none;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 4px;
  padding: 2px 4px;
}

/* Selection border */
.selection-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px dashed #6366f1;
  border-radius: 2px;
  pointer-events: none;
}

/* Header bar */
.shape-header {
  position: absolute;
  top: -28px;
  left: -2px;
  right: -2px;
  height: 24px;
  background: #6366f1;
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  cursor: grab;
  z-index: 10;
}

.shape-header:active {
  cursor: grabbing;
}

.shape-label {
  font-size: 11px;
  color: #ffffff;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shape-delete-btn {
  background: none;
  border: none;
  color: rgba(255,255,255,0.7);
  font-size: 16px;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  border-radius: 2px;
}

.shape-delete-btn:hover {
  color: #fff;
  background: rgba(255,255,255,0.2);
}

/* Resize handles */
.resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #6366f1;
  border: 2px solid #ffffff;
  border-radius: 2px;
  z-index: 10;
}

.handle-nw { top: -5px; left: -5px; cursor: nw-resize; }
.handle-n  { top: -5px; left: calc(50% - 5px); cursor: n-resize; }
.handle-ne { top: -5px; right: -5px; cursor: ne-resize; }
.handle-e  { top: calc(50% - 5px); right: -5px; cursor: e-resize; }
.handle-se { bottom: -5px; right: -5px; cursor: se-resize; }
.handle-s  { bottom: -5px; left: calc(50% - 5px); cursor: s-resize; }
.handle-sw { bottom: -5px; left: -5px; cursor: sw-resize; }
.handle-w  { top: calc(50% - 5px); left: -5px; cursor: w-resize; }
</style>
