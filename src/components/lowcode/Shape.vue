<script setup>
import { ref, toRef } from 'vue'
import ChartRenderer from './ChartRenderer.vue'
import { useDataBinding } from '../../composables/useDataBinding.js'

const props = defineProps({
  component: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  scale: { type: Number, default: 1 },
})

const emit = defineEmits(['select', 'update-position', 'update-size', 'update-bounds', 'delete', 'mutation', 'drag-end', 'contextmenu'])

const componentRef = toRef(props, 'component')
const { data: boundData, loading: dataLoading } = useDataBinding(componentRef)

const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const compStart = ref({ x: 0, y: 0 })
const isResizing = ref(false)
const resizeHandle = ref('')
const resizeStart = ref({ x: 0, y: 0, w: 0, h: 0, mx: 0, my: 0 })
const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
const GRID = 10

function snap(value) {
  return Math.round(value / GRID) * GRID
}

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

function onResizeMouseDown(e, handle) {
  if (props.component.locked) return
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
  const handle = resizeHandle.value
  let { x, y, w, h } = resizeStart.value

  if (handle.includes('e')) w += dx
  if (handle.includes('w')) { x += dx; w -= dx }
  if (handle.includes('s')) h += dy
  if (handle.includes('n')) { y += dy; h -= dy }

  emit('update-bounds', props.component.id, snap(x), snap(y), snap(Math.max(50, w)), snap(Math.max(50, h)))
}

function onResizeEnd() {
  isResizing.value = false
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
  emit('mutation')
}

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
    :class="{ selected, dragging: isDragging, resizing: isResizing, locked: component.locked }"
    :style="{
      left: component.x + 'px',
      top: component.y + 'px',
      width: component.w + 'px',
      height: component.h + 'px',
      zIndex: component.zIndex || 1,
      opacity: component.data?.style?.opacity ?? 1,
      borderRadius: (component.data?.style?.borderRadius || 0) + 'px',
      boxShadow: component.data?.style?.boxShadow || 'none',
      background: component.data?.style?.background || 'transparent',
      border: component.data?.style?.border || 'none',
    }"
    @click="onClick"
    @contextmenu="onContextMenu"
  >
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

    <div v-if="selected && !component.locked" class="shape-header" @mousedown="onHeaderMouseDown">
      <span>{{ component.data?.label || component.type }}</span>
      <button title="删除" @click="onDelete">×</button>
    </div>

    <template v-if="selected && !component.locked">
      <div
        v-for="handle in handles"
        :key="handle"
        class="resize-handle"
        :class="'handle-' + handle"
        @mousedown="onResizeMouseDown($event, handle)"
      ></div>
    </template>

    <div v-if="component.locked" class="lock-overlay" title="已锁定">锁定</div>
    <div v-if="selected" class="selection-border"></div>
  </div>
</template>

<style scoped>
.shape-wrapper {
  position: absolute;
  cursor: pointer;
  transition: box-shadow 0.15s;
  animation: shape-enter 0.18s ease-out;
}

@keyframes shape-enter {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.shape-wrapper:hover {
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.26);
}

.shape-wrapper.selected {
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.65);
}

.shape-wrapper.dragging,
.shape-wrapper.resizing {
  opacity: 0.92;
}

.shape-content {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.shape-header {
  position: absolute;
  left: -1px;
  right: -1px;
  top: -30px;
  z-index: 10;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 8px;
  border-radius: 5px 5px 0 0;
  color: #ffffff;
  background: #2563eb;
  cursor: grab;
}

.shape-header span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 800;
}

.shape-header button {
  width: 20px;
  height: 20px;
  border: 0;
  border-radius: 4px;
  color: rgba(255,255,255,0.78);
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  line-height: 18px;
}

.shape-header button:hover {
  color: #ffffff;
  background: rgba(255,255,255,0.2);
}

.selection-border {
  position: absolute;
  inset: 0;
  border: 1px dashed #38bdf8;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  z-index: 11;
  width: 10px;
  height: 10px;
  border: 2px solid #ffffff;
  border-radius: 2px;
  background: #38bdf8;
}

.handle-nw { top: -5px; left: -5px; cursor: nw-resize; }
.handle-n  { top: -5px; left: calc(50% - 5px); cursor: n-resize; }
.handle-ne { top: -5px; right: -5px; cursor: ne-resize; }
.handle-e  { top: calc(50% - 5px); right: -5px; cursor: e-resize; }
.handle-se { bottom: -5px; right: -5px; cursor: se-resize; }
.handle-s  { bottom: -5px; left: calc(50% - 5px); cursor: s-resize; }
.handle-sw { bottom: -5px; left: -5px; cursor: sw-resize; }
.handle-w  { top: calc(50% - 5px); left: -5px; cursor: w-resize; }

.lock-overlay {
  position: absolute;
  right: 6px;
  top: 6px;
  z-index: 9;
  padding: 2px 6px;
  border-radius: 4px;
  color: #cbd5e1;
  background: rgba(15, 23, 42, 0.75);
  font-size: 11px;
  pointer-events: none;
}
</style>
