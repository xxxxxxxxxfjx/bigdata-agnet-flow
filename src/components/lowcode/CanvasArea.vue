<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCanvas } from '../../composables/useCanvas.js'
import { useAlignGuide } from '../../composables/useAlignGuide.js'
import { useKeyboard } from '../../composables/useKeyboard.js'
import Shape from './Shape.vue'
import ContextMenu from './ContextMenu.vue'

const props = defineProps({
  scale: { type: Number, default: 1 },
})

const emit = defineEmits(['canvas-click', 'component-mutated', 'update-scale', 'update-pan'])

const {
  components,
  selectedId,
  selectedIds,
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

const { guides, computeGuides, clearGuides, alignComponents } = useAlignGuide()

const canvasRef = ref(null)

// Context menu
const contextMenu = ref({ visible: false, x: 0, y: 0, targetId: null })

// Box selection
const boxSelect = ref({ active: false, startX: 0, startY: 0, x: 0, y: 0, w: 0, h: 0 })

// Drop handler
function onDragOver(e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
}

function onDrop(e) {
  const type = e.dataTransfer?.getData('application/lowcode-component-type')
  if (!type) return
  const bounds = canvasRef.value?.getBoundingClientRect()
  if (!bounds) return
  const x = (e.clientX - bounds.left) / props.scale
  const y = (e.clientY - bounds.top) / props.scale
  addComponent(type, x, y)
  emit('component-mutated')
}

// Selection
function onCanvasMouseDown(e) {
  // Middle-click or space+left-click = pan
  if (e.button === 1 || (e.button === 0 && spaceHeld.value)) {
    e.preventDefault()
    panStartDrag(e)
    return
  }
  if (e.target !== canvasRef.value && !e.target.classList.contains('canvas-surface')) return
  if (e.button !== 0) return // Left click only

  const bounds = canvasRef.value.getBoundingClientRect()
  const x = (e.clientX - bounds.left) / props.scale
  const y = (e.clientY - bounds.top) / props.scale

  // Start box selection
  boxSelect.value = { active: true, startX: x, startY: y, x, y, w: 0, h: 0 }

  const onMove = (ev) => {
    const cx = (ev.clientX - bounds.left) / props.scale
    const cy = (ev.clientY - bounds.top) / props.scale
    boxSelect.value.x = Math.min(boxSelect.value.startX, cx)
    boxSelect.value.y = Math.min(boxSelect.value.startY, cy)
    boxSelect.value.w = Math.abs(cx - boxSelect.value.startX)
    boxSelect.value.h = Math.abs(cy - boxSelect.value.startY)
  }

  const onUp = () => {
    if (boxSelect.value.w > 5 || boxSelect.value.h > 5) {
      selectInRect(boxSelect.value)
    } else {
      deselectComponent()
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

// --- Wheel zoom ---
function onWheel(e) {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.06 : 0.06
  const newScale = Math.max(0.25, Math.min(2, props.scale + delta))
  emit('update-scale', Math.round(newScale * 100) / 100)
}

// --- Middle-click / Space+drag pan ---
const isPanning = ref(false)
const spaceHeld = ref(false)

function onKeyDown(e) {
  if (e.code === 'Space' && !['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName) && !e.repeat) {
    e.preventDefault()
    spaceHeld.value = true
  }
}
function onKeyUp(e) {
  if (e.code === 'Space') spaceHeld.value = false
}
onMounted(() => {
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('keyup', onKeyUp)
})

// Pan drag handler
function panStartDrag(e) {
  isPanning.value = true
  const scrollEl = canvasRef.value?.parentElement
  const startX = e.clientX
  const startY = e.clientY
  const startSX = scrollEl?.scrollLeft || 0
  const startSY = scrollEl?.scrollTop || 0

  const onMove = (ev) => {
    const el = canvasRef.value?.parentElement
    if (el) {
      el.scrollLeft = startSX - (ev.clientX - startX)
      el.scrollTop = startSY - (ev.clientY - startY)
    }
  }
  const onUp = () => {
    isPanning.value = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

// Middle-click pan on canvas area (outside canvas surface)
function onCanvasMouseDownPan(e) {
  if (e.button === 1 || (e.button === 0 && spaceHeld.value)) {
    e.preventDefault()
    panStartDrag(e)
  }
}

function onShapeSelect(id, e) {
  const multi = e?.ctrlKey || e?.metaKey
  selectComponent(id, multi)
}

// Mutations
function onPositionUpdate(id, x, y) {
  // Compute alignment guides
  const comp = components.value.find((c) => c.id === id)
  if (comp) {
    const snap = computeGuides({ x, y, w: comp.w, h: comp.h }, components.value, id)
    updatePosition(id, snap.x, snap.y)
  } else {
    updatePosition(id, x, y)
  }
}

function onDragEnd() {
  clearGuides()
  emit('component-mutated')
}

function onSizeUpdate(id, w, h) {
  updateSize(id, w, h)
}

function onBoundsUpdate(id, x, y, w, h) {
  const comp = components.value.find((c) => c.id === id)
  if (comp) {
    const snap = computeGuides({ x, y, w, h }, components.value, id)
    comp.x = Math.round(snap.x)
    comp.y = Math.round(snap.y)
    comp.w = Math.max(50, Math.round(w))
    comp.h = Math.max(50, Math.round(h))
  }
}

function onDelete(id) {
  removeComponent(id)
  emit('component-mutated')
}

function onMutation() {
  emit('component-mutated')
}

// Context menu handlers
function onCanvasContextMenu(e) {
  e.preventDefault()
  const bounds = canvasRef.value?.getBoundingClientRect()
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    targetId: null,
  }
}

function onShapeContextMenu(id, e) {
  e.preventDefault()
  e.stopPropagation()
  // Ensure this component is selected
  if (!selectedIds.value.includes(id)) {
    selectComponent(id)
  }
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    targetId: id,
  }
}

function closeContextMenu() {
  contextMenu.value.visible = false
}

// Context menu actions
function ctxDelete() {
  if (selectedIds.value.length > 0) {
    deleteSelected()
    emit('component-mutated')
  }
}

function ctxCopy() {
  copyToClipboard(selectedIds.value)
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

function ctxBringFront() {
  if (selectedId.value) bringToFront(selectedId.value)
}

function ctxSendBack() {
  if (selectedId.value) sendToBack(selectedId.value)
}

function ctxSelectAll() {
  selectAll()
}

// Keyboard shortcuts
useKeyboard({
  onDelete: () => {
    if (selectedIds.value.length > 0) {
      deleteSelected()
      emit('component-mutated')
    }
  },
  onCopy: () => copyToClipboard(selectedIds.value),
  onPaste: () => {
    pasteFromClipboard()
    emit('component-mutated')
  },
  onSelectAll: () => selectAll(),
  onDuplicate: () => {
    if (selectedId.value) {
      duplicateComponent(selectedId.value)
      emit('component-mutated')
    }
  },
  onEscape: () => deselectComponent(),
  onArrowUp: (step) => moveSelectedComponents(0, -step),
  onArrowDown: (step) => moveSelectedComponents(0, step),
  onArrowLeft: (step) => moveSelectedComponents(-step, 0),
  onArrowRight: (step) => moveSelectedComponents(step, 0),
})

// Build context menu items
const canvasMenuItems = computed(() => [
  { label: '全选', icon: '☐', shortcut: 'Ctrl+A', action: ctxSelectAll },
  { label: '粘贴', icon: '📋', shortcut: 'Ctrl+V', action: ctxPaste, disabled: useCanvas().clipboard.value.length === 0 },
])

const componentMenuItems = computed(() => [
  { label: '复制', icon: '📋', shortcut: 'Ctrl+C', action: ctxCopy },
  { label: '粘贴', icon: '📋', shortcut: 'Ctrl+V', action: ctxPaste, disabled: useCanvas().clipboard.value.length === 0 },
  { label: '复制并偏移', icon: '📄', shortcut: 'Ctrl+D', action: ctxDuplicate },
  { divider: true },
  { label: '置顶', icon: '⬆', action: ctxBringFront },
  { label: '置底', icon: '⬇', action: ctxSendBack },
  { divider: true },
  { label: '删除', icon: '🗑️', shortcut: 'Del', action: ctxDelete, danger: true },
])

// Sort components
const sortedComponents = computed(() => {
  return [...components.value].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
})

const bgStyle = computed(() => {
  const bg = canvasStyle.value.background
  if (bg && (bg.startsWith('linear-gradient') || bg.startsWith('radial-gradient') || bg.startsWith('#'))) {
    return { background: bg }
  }
  return { background: '#0f172a' }
})
</script>

<template>
  <div
    class="canvas-area"
    :class="{ panning: spaceHeld }"
    @wheel.prevent="onWheel"
    @mousedown="onCanvasMouseDownPan"
  >
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
        <!-- Grid overlay -->
        <svg v-if="canvasStyle.showGrid" class="canvas-grid" :width="canvasStyle.width" :height="canvasStyle.height">
          <defs>
            <pattern id="canvasGridPattern" :width="canvasStyle.gridSize||10" :height="canvasStyle.gridSize||10" patternUnits="userSpaceOnUse">
              <path :d="`M ${canvasStyle.gridSize||10} 0 L 0 0 0 ${canvasStyle.gridSize||10}`" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#canvasGridPattern)"/>
        </svg>

        <!-- Resolution marker -->
        <div class="canvas-marker">{{ canvasStyle.width }} × {{ canvasStyle.height }}</div>

        <!-- Alignment guides -->
        <svg v-if="guides.length > 0" class="align-guides-svg" :width="canvasStyle.width" :height="canvasStyle.height">
          <line
            v-for="(g, i) in guides"
            :key="'g'+i"
            :x1="g.type==='v'?g.position:g.range[0]"
            :y1="g.type==='h'?g.position:g.range[0]"
            :x2="g.type==='v'?g.position:g.range[1]"
            :y2="g.type==='h'?g.position:g.range[1]"
            stroke="#6366f1"
            stroke-width="1"
            stroke-dasharray="4,2"
          />
        </svg>

        <!-- Box selection rect -->
        <div
          v-if="boxSelect.active && boxSelect.w > 3 && boxSelect.h > 3"
          class="box-selection"
          :style="{
            left: boxSelect.x + 'px',
            top: boxSelect.y + 'px',
            width: boxSelect.w + 'px',
            height: boxSelect.h + 'px',
          }"
        ></div>

        <!-- Components -->
        <Shape
          v-for="comp in sortedComponents"
          :key="comp.id"
          :component="comp"
          :selected="selectedIds.includes(comp.id)"
          :scale="scale"
          @select="onShapeSelect"
          @update-position="onPositionUpdate"
          @update-size="onSizeUpdate"
          @update-bounds="onBoundsUpdate"
          @delete="onDelete"
          @mutation="onMutation"
          @drag-end="onDragEnd"
          @contextmenu="onShapeContextMenu"
        />

        <!-- Empty hint -->
        <div v-if="components.length === 0" class="canvas-hint">
          <div class="hint-icon">📊</div>
          <div class="hint-text">从左侧拖拽组件到此处</div>
          <div class="hint-sub">右键查看更多操作 · 设计尺寸: {{ canvasStyle.width }} × {{ canvasStyle.height }}</div>
        </div>
      </div>
    </div>

    <!-- Context Menu -->
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
  background: #1e293b;
}

/* Space-held = pan mode */
.canvas-area.panning {
  cursor: grab;
}
.canvas-area.panning:active {
  cursor: grabbing;
}

.canvas-scroll {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 24px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}

.canvas-surface {
  position: relative;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.4);
  user-select: none;
}

.canvas-grid {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.canvas-marker {
  position: absolute;
  bottom: 4px;
  right: 8px;
  font-size: 10px;
  color: rgba(255,255,255,0.2);
  font-family: monospace;
  pointer-events: none;
}

.align-guides-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 999;
}

.box-selection {
  position: absolute;
  background: rgba(99, 102, 241, 0.15);
  border: 1px dashed #6366f1;
  z-index: 998;
  pointer-events: none;
}

.canvas-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.hint-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.4; }
.hint-text { font-size: 16px; color: #64748b; margin-bottom: 6px; }
.hint-sub { font-size: 12px; color: #475569; }
</style>
