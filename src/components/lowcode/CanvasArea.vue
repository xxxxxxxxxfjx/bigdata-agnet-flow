<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useCanvas } from '../../composables/useCanvas.js'
import { useAlignGuide } from '../../composables/useAlignGuide.js'
import { useKeyboard } from '../../composables/useKeyboard.js'
import Shape from './Shape.vue'
import ContextMenu from './ContextMenu.vue'

const props = defineProps({
  scale: { type: Number, default: 1 },
})

const emit = defineEmits(['canvas-click', 'component-mutated', 'update-scale'])

const {
  components,
  selectedId,
  selectedIds,
  clipboard,
  canvasStyle,
  addComponent,
  removeComponent,
  selectComponent,
  deselectComponent,
  selectAll,
  selectInRect,
  updatePosition,
  updateSize,
  deleteSelected,
  copyToClipboard,
  pasteFromClipboard,
  moveSelectedComponents,
  bringToFront,
  sendToBack,
  duplicateComponent,
} = useCanvas()

const { guides, computeGuides, clearGuides } = useAlignGuide()

const canvasRef = ref(null)
const contextMenu = ref({ visible: false, x: 0, y: 0, targetId: null })
const boxSelect = ref({ active: false, startX: 0, startY: 0, x: 0, y: 0, w: 0, h: 0 })
const isPanning = ref(false)
const spaceHeld = ref(false)

const sortedComponents = computed(() => [...components.value].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)))
const bgStyle = computed(() => {
  const bg = canvasStyle.value.background
  if (bg && (bg.startsWith('linear-gradient') || bg.startsWith('radial-gradient') || bg.startsWith('#'))) {
    return { background: bg }
  }
  return { background: '#0f172a' }
})

const canvasMenuItems = computed(() => [
  { label: '全选', icon: 'A', shortcut: 'Ctrl+A', action: () => selectAll() },
  { label: '粘贴', icon: 'V', shortcut: 'Ctrl+V', action: ctxPaste, disabled: clipboard.value.length === 0 },
])

const componentMenuItems = computed(() => [
  { label: '复制', icon: 'C', shortcut: 'Ctrl+C', action: () => copyToClipboard(selectedIds.value) },
  { label: '粘贴', icon: 'V', shortcut: 'Ctrl+V', action: ctxPaste, disabled: clipboard.value.length === 0 },
  { label: '复制并偏移', icon: 'D', shortcut: 'Ctrl+D', action: ctxDuplicate },
  { divider: true },
  { label: '置顶', icon: '↑', action: () => selectedId.value && bringToFront(selectedId.value) },
  { label: '置底', icon: '↓', action: () => selectedId.value && sendToBack(selectedId.value) },
  { divider: true },
  { label: '删除', icon: '×', shortcut: 'Del', action: ctxDelete, danger: true },
])

function onDragOver(e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
}

function onDrop(e) {
  const type = e.dataTransfer?.getData('application/lowcode-component-type')
  if (!type) return
  const bounds = canvasRef.value?.getBoundingClientRect()
  if (!bounds) return
  addComponent(type, (e.clientX - bounds.left) / props.scale, (e.clientY - bounds.top) / props.scale)
  emit('component-mutated')
}

function onCanvasMouseDown(e) {
  if (e.button === 1 || (e.button === 0 && spaceHeld.value)) {
    e.preventDefault()
    panStartDrag(e)
    return
  }
  if (e.target !== canvasRef.value && !e.target.classList.contains('canvas-surface')) return
  if (e.button !== 0) return

  const bounds = canvasRef.value.getBoundingClientRect()
  const startX = (e.clientX - bounds.left) / props.scale
  const startY = (e.clientY - bounds.top) / props.scale
  boxSelect.value = { active: true, startX, startY, x: startX, y: startY, w: 0, h: 0 }

  const onMove = (ev) => {
    const cx = (ev.clientX - bounds.left) / props.scale
    const cy = (ev.clientY - bounds.top) / props.scale
    boxSelect.value.x = Math.min(startX, cx)
    boxSelect.value.y = Math.min(startY, cy)
    boxSelect.value.w = Math.abs(cx - startX)
    boxSelect.value.h = Math.abs(cy - startY)
  }

  const onUp = () => {
    if (boxSelect.value.w > 5 || boxSelect.value.h > 5) {
      selectInRect(boxSelect.value)
    } else {
      deselectComponent()
      emit('canvas-click')
    }
    boxSelect.value.active = false
    boxSelect.value.w = 0
    boxSelect.value.h = 0
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function onWheel(e) {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.06 : 0.06
  emit('update-scale', Math.round(Math.max(0.25, Math.min(2, props.scale + delta)) * 100) / 100)
}

function onKeyDown(e) {
  if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && !e.repeat) {
    e.preventDefault()
    spaceHeld.value = true
  }
}

function onKeyUp(e) {
  if (e.code === 'Space') spaceHeld.value = false
}

function panStartDrag(e) {
  isPanning.value = true
  const scrollEl = canvasRef.value?.parentElement
  const startX = e.clientX
  const startY = e.clientY
  const startSX = scrollEl?.scrollLeft || 0
  const startSY = scrollEl?.scrollTop || 0

  const onMove = (ev) => {
    const el = canvasRef.value?.parentElement
    if (!el) return
    el.scrollLeft = startSX - (ev.clientX - startX)
    el.scrollTop = startSY - (ev.clientY - startY)
  }
  const onUp = () => {
    isPanning.value = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function onCanvasMouseDownPan(e) {
  if (e.button === 1 || (e.button === 0 && spaceHeld.value)) {
    e.preventDefault()
    panStartDrag(e)
  }
}

function onShapeSelect(id, e) {
  selectComponent(id, e?.ctrlKey || e?.metaKey)
}

function onPositionUpdate(id, x, y) {
  const comp = components.value.find((c) => c.id === id)
  if (!comp) return updatePosition(id, x, y)
  const snap = computeGuides({ x, y, w: comp.w, h: comp.h }, components.value, id)
  updatePosition(id, snap.x, snap.y)
}

function onBoundsUpdate(id, x, y, w, h) {
  const comp = components.value.find((c) => c.id === id)
  if (!comp) return
  const snap = computeGuides({ x, y, w, h }, components.value, id)
  comp.x = Math.round(snap.x)
  comp.y = Math.round(snap.y)
  comp.w = Math.max(50, Math.round(w))
  comp.h = Math.max(50, Math.round(h))
}

function onDragEnd() {
  clearGuides()
  emit('component-mutated')
}

function onDelete(id) {
  removeComponent(id)
  emit('component-mutated')
}

function onCanvasContextMenu(e) {
  e.preventDefault()
  contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, targetId: null }
}

function onShapeContextMenu(id, e) {
  e.preventDefault()
  e.stopPropagation()
  if (!selectedIds.value.includes(id)) selectComponent(id)
  contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, targetId: id }
}

function closeContextMenu() {
  contextMenu.value.visible = false
}

function ctxDelete() {
  if (selectedIds.value.length > 0) {
    deleteSelected()
    emit('component-mutated')
  }
}

function ctxPaste() {
  pasteFromClipboard()
  emit('component-mutated')
}

function ctxDuplicate() {
  if (selectedId.value) {
    duplicateComponent(selectedId.value)
    emit('component-mutated')
  }
}

useKeyboard({
  onDelete: () => {
    if (selectedIds.value.length > 0) {
      deleteSelected()
      emit('component-mutated')
    }
  },
  onCopy: () => copyToClipboard(selectedIds.value),
  onPaste: ctxPaste,
  onSelectAll: () => selectAll(),
  onDuplicate: ctxDuplicate,
  onEscape: () => deselectComponent(),
  onArrowUp: (step) => moveSelectedComponents(0, -step),
  onArrowDown: (step) => moveSelectedComponents(0, step),
  onArrowLeft: (step) => moveSelectedComponents(-step, 0),
  onArrowRight: (step) => moveSelectedComponents(step, 0),
})

onMounted(() => {
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('keyup', onKeyUp)
})
</script>

<template>
  <div class="canvas-area" :class="{ panning: spaceHeld || isPanning }" @wheel.prevent="onWheel" @mousedown="onCanvasMouseDownPan">
    <div class="canvas-scroll">
      <div
        ref="canvasRef"
        class="canvas-surface"
        :style="{
          width: canvasStyle.width + 'px',
          height: canvasStyle.height + 'px',
          ...bgStyle,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }"
        @dragover="onDragOver"
        @drop="onDrop"
        @mousedown="onCanvasMouseDown"
        @contextmenu="onCanvasContextMenu"
      >
        <svg v-if="canvasStyle.showGrid" class="canvas-grid" :width="canvasStyle.width" :height="canvasStyle.height">
          <defs>
            <pattern id="canvasGridPattern" :width="canvasStyle.gridSize || 10" :height="canvasStyle.gridSize || 10" patternUnits="userSpaceOnUse">
              <path :d="`M ${canvasStyle.gridSize || 10} 0 L 0 0 0 ${canvasStyle.gridSize || 10}`" fill="none" stroke="rgba(255,255,255,0.045)" stroke-width="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#canvasGridPattern)" />
        </svg>

        <div class="canvas-marker">{{ canvasStyle.width }} x {{ canvasStyle.height }}</div>

        <svg v-if="guides.length > 0" class="align-guides-svg" :width="canvasStyle.width" :height="canvasStyle.height">
          <line
            v-for="(g, i) in guides"
            :key="i"
            :x1="g.type === 'v' ? g.position : g.range[0]"
            :y1="g.type === 'h' ? g.position : g.range[0]"
            :x2="g.type === 'v' ? g.position : g.range[1]"
            :y2="g.type === 'h' ? g.position : g.range[1]"
            stroke="#38bdf8"
            stroke-width="1"
            stroke-dasharray="4,2"
          />
        </svg>

        <div
          v-if="boxSelect.active && boxSelect.w > 3 && boxSelect.h > 3"
          class="box-selection"
          :style="{ left: boxSelect.x + 'px', top: boxSelect.y + 'px', width: boxSelect.w + 'px', height: boxSelect.h + 'px' }"
        ></div>

        <Shape
          v-for="comp in sortedComponents"
          :key="comp.id"
          :component="comp"
          :selected="selectedIds.includes(comp.id)"
          :scale="scale"
          @select="onShapeSelect"
          @update-position="onPositionUpdate"
          @update-size="updateSize"
          @update-bounds="onBoundsUpdate"
          @delete="onDelete"
          @mutation="emit('component-mutated')"
          @drag-end="onDragEnd"
          @contextmenu="onShapeContextMenu"
        />

        <div v-if="components.length === 0" class="canvas-hint">
          <div class="hint-title">拖入图表开始搭建</div>
          <div class="hint-sub">支持组件库拖拽、右键菜单、框选、多选对齐、滚轮缩放和空格拖动画布</div>
        </div>
      </div>
    </div>

    <ContextMenu
      :visible="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="contextMenu.targetId ? componentMenuItems : canvasMenuItems"
      @close="closeContextMenu"
    />
  </div>
</template>

<style scoped>
.canvas-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95)),
    repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(148, 163, 184, 0.06) 24px),
    repeating-linear-gradient(90deg, transparent, transparent 23px, rgba(148, 163, 184, 0.06) 24px);
}

.canvas-area.panning {
  cursor: grab;
}

.canvas-scroll {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 28px;
}

.canvas-surface {
  position: relative;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 18px 60px rgba(0,0,0,0.42);
  user-select: none;
}

.canvas-grid,
.align-guides-svg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.align-guides-svg {
  z-index: 999;
}

.canvas-marker {
  position: absolute;
  right: 10px;
  bottom: 8px;
  color: rgba(255,255,255,0.26);
  font: 11px Consolas, Monaco, monospace;
  pointer-events: none;
}

.box-selection {
  position: absolute;
  z-index: 998;
  border: 1px dashed #38bdf8;
  background: rgba(56, 189, 248, 0.16);
  pointer-events: none;
}

.canvas-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 520px;
  max-width: 80%;
  padding: 28px;
  border: 1px dashed rgba(148, 163, 184, 0.35);
  border-radius: 8px;
  text-align: center;
  background: rgba(15, 23, 42, 0.35);
  pointer-events: none;
}

.hint-title {
  color: #e2e8f0;
  font-size: 18px;
  font-weight: 800;
}

.hint-sub {
  margin-top: 8px;
  color: #94a3b8;
  font-size: 12px;
}
</style>
