<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ComponentPanel from '../components/lowcode/ComponentPanel.vue'
import CanvasArea from '../components/lowcode/CanvasArea.vue'
import StylePanel from '../components/lowcode/StylePanel.vue'
import PreviewModal from '../components/lowcode/PreviewModal.vue'
import PublishModal from '../components/lowcode/PublishModal.vue'
import DatasetManager from '../components/lowcode/DatasetManager.vue'
import { useCanvas } from '../composables/useCanvas.js'
import { useHistory } from '../composables/useHistory.js'
import { useAutosave } from '../composables/useAutosave.js'
import { useKeyboard } from '../composables/useKeyboard.js'
import { useAlignGuide } from '../composables/useAlignGuide.js'
import { SCREEN_TEMPLATES } from '../config/templates.js'

const props = defineProps({
  id: { type: String, default: '' },
})

const router = useRouter()
const {
  components, selectedId, selectedIds, canvasStyle,
  deselectComponent, deleteSelected, copyToClipboard, pasteFromClipboard,
  duplicateComponent, exportCanvas, importCanvas, updateCanvasStyle, updatePosition,
} = useCanvas()
const { undo, redo, canUndo, canRedo, pushSnapshot, clearHistory } = useHistory()
const { alignComponents } = useAlignGuide()
const {
  projects, currentProjectId, lastSaveTime, isDirty,
  createProject, deleteProject, switchProject, renameProject,
  saveProject, startAutosave, setupBeforeUnload,
} = useAutosave(components, canvasStyle, 800)

const showPreview = ref(false)
const showPublish = ref(false)
const showProjects = ref(false)
const showTemplates = ref(false)
const showDatasets = ref(false)
const showCanvasSettings = ref(false)
const canvasScale = ref(0.75)
const newProjectName = ref('')
const editingProjectName = ref(null)
const editNameValue = ref('')
const leftPanelWidth = ref(280)
const rightPanelWidth = ref(320)
let resizePanelType = null

const currentProject = computed(() => projects.value.find((p) => p.id === currentProjectId.value))
const chartCount = computed(() => components.value.filter((c) => ['bar', 'line', 'pie', 'scatter', 'area', 'radar', 'funnel', 'gauge', 'wordCloud', 'liquidFill'].includes(c.type)).length)
const metricCount = computed(() => components.value.filter((c) => ['numberCounter', 'table', 'titleText', 'richText', 'dateTime'].includes(c.type)).length)
const layoutDensity = computed(() => {
  const area = Number(canvasStyle.value.width || 0) * Number(canvasStyle.value.height || 0)
  const used = components.value.reduce((sum, c) => sum + c.w * c.h, 0)
  return area ? Math.min(100, Math.round((used / area) * 100)) : 0
})

const themePresets = [
  { name: '深蓝指挥中心', background: 'linear-gradient(to bottom, #07111f, #102a43)', gridSize: 10, showGrid: true },
  { name: '暗色 BI 工作台', background: 'linear-gradient(to bottom, #111827, #1f2937)', gridSize: 12, showGrid: true },
  { name: '青绿色运营屏', background: 'linear-gradient(to bottom, #06241f, #0f3d3e)', gridSize: 10, showGrid: true },
  { name: '纯黑发布屏', background: '#020617', gridSize: 10, showGrid: false },
]

function startResize(type, e) {
  e.preventDefault()
  resizePanelType = type
  const startX = e.clientX
  const startW = type === 'left' ? leftPanelWidth.value : rightPanelWidth.value

  const onMove = (ev) => {
    const dx = ev.clientX - startX
    const newW = type === 'left'
      ? Math.max(220, Math.min(520, startW + dx))
      : Math.max(260, Math.min(520, startW - dx))
    if (resizePanelType === 'left') leftPanelWidth.value = newW
    if (resizePanelType === 'right') rightPanelWidth.value = newW
  }
  const onUp = () => {
    resizePanelType = null
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

onMounted(() => {
  // If route has an id, load that project
  if (props.id) {
    localStorage.setItem('bigdata_agent_flow_current_project', props.id)
    switchProject(props.id)
  } else if (projects.value.length === 0) {
    createProject('销售运营分析大屏', 'bigscreen')
  } else if (currentProjectId.value) {
    switchProject(currentProjectId.value)
  }
  startAutosave()
  setupBeforeUnload()
})

useKeyboard({
  onDelete: () => {
    if (selectedIds.value.length > 0) deleteSelected()
  },
  onUndo: () => handleUndo(),
  onRedo: () => handleRedo(),
  onCopy: () => copyToClipboard(selectedIds.value),
  onPaste: () => pasteFromClipboard(),
  onSave: () => saveCurrentProject(),
  onDuplicate: () => {
    if (selectedId.value) duplicateComponent(selectedId.value)
  },
  onEscape: () => {
    deselectComponent()
    showProjects.value = false
    showTemplates.value = false
    showCanvasSettings.value = false
  },
})

function snapshotBeforeMutate() {
  pushSnapshot({
    components: JSON.parse(JSON.stringify(components.value)),
    selectedId: selectedId.value,
    selectedIds: [...selectedIds.value],
  })
}

function withHistory(fn) {
  snapshotBeforeMutate()
  fn()
}

function saveCurrentProject() {
  if (!currentProjectId.value) return
  saveProject(currentProjectId.value, {
    components: components.value,
    canvasStyle: canvasStyle.value,
  })
}

function handleUndo() {
  const snapshot = undo()
  if (snapshot) {
    components.value = snapshot.components
    selectedId.value = snapshot.selectedId
    selectedIds.value = snapshot.selectedIds || (snapshot.selectedId ? [snapshot.selectedId] : [])
  }
}

function handleRedo() {
  const snapshot = redo()
  if (snapshot) {
    components.value = snapshot.components
    selectedId.value = snapshot.selectedId
    selectedIds.value = snapshot.selectedIds || (snapshot.selectedId ? [snapshot.selectedId] : [])
  }
}

function handleExport() {
  const json = exportCanvas()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dashboard-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      snapshotBeforeMutate()
      importCanvas(ev.target.result)
      clearHistory()
    }
    reader.readAsText(file)
  }
  input.click()
}

function handleClear() {
  if (components.value.length === 0) return
  if (!confirm(`确定清空画布吗？将删除 ${components.value.length} 个组件。`)) return
  snapshotBeforeMutate()
  components.value = []
  selectedId.value = null
  selectedIds.value = []
}

function alignSelected(type) {
  if (selectedIds.value.length < 2) return
  withHistory(() => {
    const comps = selectedIds.value.map((id) => components.value.find((c) => c.id === id)).filter(Boolean)
    const aligned = alignComponents(comps, type)
    aligned.forEach((c) => updatePosition(c.id, c.x, c.y))
  })
}

function handleCanvasResize(w, h) {
  updateCanvasStyle('width', w)
  updateCanvasStyle('height', h)
}

function applyThemePreset(preset) {
  Object.entries(preset).forEach(([key, value]) => {
    if (key !== 'name') updateCanvasStyle(key, value)
  })
}

function loadTemplate(template) {
  withHistory(() => {
    components.value = template.components.map((c) => ({
      ...c,
      zIndex: c.zIndex || 1,
      visible: c.visible !== false,
      locked: !!c.locked,
    }))
    if (template.canvasStyle) {
      canvasStyle.value = { ...canvasStyle.value, ...template.canvasStyle }
    }
  })
  showTemplates.value = false
}

function handleCreateProject() {
  if (!newProjectName.value.trim()) return
  saveCurrentProject()
  const p = createProject(newProjectName.value.trim(), 'bigscreen')
  clearHistory()
  newProjectName.value = ''
  if (p) router.replace(`/lowcode/${p.id}`)
}

function handleSwitchProject(id) {
  if (currentProjectId.value === id) return
  saveCurrentProject()
  snapshotBeforeMutate()
  switchProject(id)
  clearHistory()
  router.replace(`/lowcode/${id}`)
}

function handleDeleteProject(id) {
  if (!confirm('确定删除这个项目吗？此操作不可恢复。')) return
  deleteProject(id)
}

function startRename(id) {
  const p = projects.value.find((pr) => pr.id === id)
  if (p) {
    editingProjectName.value = id
    editNameValue.value = p.name
  }
}

function confirmRename() {
  if (editingProjectName.value && editNameValue.value.trim()) {
    renameProject(editingProjectName.value, editNameValue.value.trim())
  }
  editingProjectName.value = null
}

function onComponentMutated() {
  snapshotBeforeMutate()
}
</script>

<template>
  <div class="lowcode-editor">
    <header class="workbench-header">
      <div class="header-left">
        <button class="icon-action" title="返回大屏列表" @click="router.push('/lowcode')">←</button>
        <div class="project-block">
          <button class="project-name" @click="showProjects = true">
            {{ currentProject?.name || '未命名仪表板' }}
          </button>
          <span class="project-meta">
            {{ canvasStyle.width }}x{{ canvasStyle.height }}
            <span v-if="lastSaveTime"> · 已保存 {{ new Date(lastSaveTime).toLocaleTimeString() }}</span>
            <span v-else> · 本地项目</span>
          </span>
        </div>
      </div>

      <div class="header-center">
        <button class="toolbar-btn" :disabled="!canUndo" @click="handleUndo">撤销</button>
        <button class="toolbar-btn" :disabled="!canRedo" @click="handleRedo">重做</button>
        <span class="divider"></span>
        <button class="toolbar-btn" @click="showDatasets = true">数据集</button>
        <button class="toolbar-btn" @click="showTemplates = true">模板</button>
        <button class="toolbar-btn" @click="showCanvasSettings = true">画布</button>
        <button class="toolbar-btn" @click="handleImport">导入</button>
        <button class="toolbar-btn" @click="handleExport">导出</button>
      </div>

      <div class="header-right">
        <div class="zoom-group">
          <button class="icon-action" title="缩小" @click="canvasScale = Math.max(0.25, canvasScale - 0.1)">−</button>
          <span>{{ Math.round(canvasScale * 100) }}%</span>
          <button class="icon-action" title="放大" @click="canvasScale = Math.min(2, canvasScale + 0.1)">+</button>
        </div>
        <button class="toolbar-btn subtle" @click="saveCurrentProject">保存</button>
        <button class="toolbar-btn primary" @click="showPreview = true">预览</button>
        <button class="toolbar-btn publish" @click="showPublish = true">发布</button>
      </div>
    </header>

    <section class="metric-strip">
      <div class="metric-card">
        <span>组件</span>
        <strong>{{ components.length }}</strong>
      </div>
      <div class="metric-card">
        <span>图表</span>
        <strong>{{ chartCount }}</strong>
      </div>
      <div class="metric-card">
        <span>指标/文本</span>
        <strong>{{ metricCount }}</strong>
      </div>
      <div class="metric-card">
        <span>布局密度</span>
        <strong>{{ layoutDensity }}%</strong>
      </div>
      <div class="metric-card wide">
        <span>状态</span>
        <strong>{{ isDirty ? '有未保存修改' : '已同步到本地' }}</strong>
      </div>
      <div class="align-group" v-if="selectedIds.length >= 2">
        <button @click="alignSelected('left')">左对齐</button>
        <button @click="alignSelected('centerH')">水平居中</button>
        <button @click="alignSelected('right')">右对齐</button>
        <button @click="alignSelected('top')">顶对齐</button>
        <button @click="alignSelected('bottom')">底对齐</button>
      </div>
      <button class="clear-btn" @click="handleClear">清空</button>
    </section>

    <main class="editor-body">
      <aside class="panel-left" :style="{ width: leftPanelWidth + 'px' }">
        <ComponentPanel />
      </aside>
      <div class="panel-resize-handle" @mousedown="startResize('left', $event)"></div>
      <CanvasArea
        :scale="canvasScale"
        @canvas-click="deselectComponent"
        @component-mutated="onComponentMutated"
        @update-scale="(s) => canvasScale = s"
      />
      <div class="panel-resize-handle" @mousedown="startResize('right', $event)"></div>
      <aside class="panel-right" :style="{ width: rightPanelWidth + 'px' }">
        <StylePanel />
      </aside>
    </main>

    <PreviewModal v-if="showPreview" @close="showPreview = false" />
    <PublishModal v-if="showPublish" @close="showPublish = false" />
    <DatasetManager v-if="showDatasets" @close="showDatasets = false" />

    <div v-if="showProjects" class="modal-overlay" @click.self="showProjects = false">
      <section class="modal-panel wide">
        <header class="modal-header">
          <h3>仪表板项目</h3>
          <button class="close-btn" @click="showProjects = false">关闭</button>
        </header>
        <div class="modal-body">
          <div class="new-project-row">
            <input v-model="newProjectName" type="text" class="field-input" placeholder="新建项目名称" @keyup.enter="handleCreateProject" />
            <button class="action-btn primary" @click="handleCreateProject">新建</button>
          </div>
          <div class="project-list">
            <div
              v-for="p in projects"
              :key="p.id"
              class="project-row"
              :class="{ active: p.id === currentProjectId }"
              @click="handleSwitchProject(p.id)"
            >
              <div class="project-avatar">BI</div>
              <div class="proj-info">
                <template v-if="editingProjectName === p.id">
                  <input v-model="editNameValue" class="inline-edit" autofocus @blur="confirmRename" @keyup.enter="confirmRename" @click.stop />
                </template>
                <template v-else>
                  <span class="proj-name">{{ p.name }}</span>
                  <span class="proj-meta">{{ p.componentCount || 0 }} 个组件 · {{ new Date(p.updatedAt).toLocaleDateString() }}</span>
                </template>
              </div>
              <div class="proj-actions" @click.stop>
                <button class="small-btn" @click="startRename(p.id)">重命名</button>
                <button class="small-btn danger" @click="handleDeleteProject(p.id)">删除</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div v-if="showTemplates" class="modal-overlay" @click.self="showTemplates = false">
      <section class="modal-panel template-panel">
        <header class="modal-header">
          <h3>模板库</h3>
          <button class="close-btn" @click="showTemplates = false">关闭</button>
        </header>
        <div class="modal-body">
          <div class="template-grid">
            <button v-for="tpl in SCREEN_TEMPLATES" :key="tpl.id" class="template-card" @click="loadTemplate(tpl)">
              <span class="tpl-thumb">{{ tpl.thumbnail }}</span>
              <span class="tpl-info">
                <strong>{{ tpl.name }}</strong>
                <small>{{ tpl.description }}</small>
                <em>{{ tpl.category }}</em>
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>

    <div v-if="showCanvasSettings" class="modal-overlay" @click.self="showCanvasSettings = false">
      <section class="modal-panel">
        <header class="modal-header">
          <h3>画布设置</h3>
          <button class="close-btn" @click="showCanvasSettings = false">关闭</button>
        </header>
        <div class="modal-body">
          <div class="setting-grid">
            <label>
              <span>宽度</span>
              <input class="field-input" type="number" :value="canvasStyle.width" @input="updateCanvasStyle('width', Number($event.target.value))" />
            </label>
            <label>
              <span>高度</span>
              <input class="field-input" type="number" :value="canvasStyle.height" @input="updateCanvasStyle('height', Number($event.target.value))" />
            </label>
            <label>
              <span>背景</span>
              <input class="field-input" :value="canvasStyle.background" @input="updateCanvasStyle('background', $event.target.value)" />
            </label>
            <label>
              <span>网格大小</span>
              <input class="field-input" type="number" :value="canvasStyle.gridSize" @input="updateCanvasStyle('gridSize', Number($event.target.value))" />
            </label>
          </div>
          <div class="switch-row">
            <label>
              <input type="checkbox" :checked="canvasStyle.showGrid" @change="updateCanvasStyle('showGrid', $event.target.checked)" />
              显示辅助网格
            </label>
          </div>
          <div class="quick-sizes">
            <button @click="handleCanvasResize(1920, 1080)">1920x1080</button>
            <button @click="handleCanvasResize(2560, 1440)">2560x1440</button>
            <button @click="handleCanvasResize(3840, 2160)">3840x2160</button>
          </div>
          <div class="theme-grid">
            <button v-for="preset in themePresets" :key="preset.name" class="theme-card" @click="applyThemePreset(preset)">
              <span :style="{ background: preset.background }"></span>
              <strong>{{ preset.name }}</strong>
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.lowcode-editor {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  background: #eef2f7;
}

.workbench-header {
  height: 52px;
  display: grid;
  grid-template-columns: minmax(260px, 1fr) auto minmax(320px, 1fr);
  align-items: center;
  gap: 16px;
  padding: 0 14px;
  background: #ffffff;
  border-bottom: 1px solid #dbe3ef;
  flex-shrink: 0;
}

.header-left,
.header-center,
.header-right,
.zoom-group,
.align-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-right {
  justify-content: flex-end;
}

.project-block {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.project-name {
  max-width: 280px;
  overflow: hidden;
  color: #0f172a;
  background: transparent;
  border: 0;
  font-size: 14px;
  font-weight: 800;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.project-meta {
  color: #64748b;
  font-size: 11px;
}

.toolbar-btn,
.icon-action,
.clear-btn,
.align-group button,
.quick-sizes button,
.theme-card,
.action-btn,
.small-btn,
.close-btn {
  height: 32px;
  padding: 0 11px;
  border: 1px solid #dbe3ef;
  border-radius: 6px;
  color: #334155;
  background: #ffffff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toolbar-btn:hover,
.icon-action:hover,
.align-group button:hover,
.quick-sizes button:hover {
  border-color: #94a3b8;
  background: #f8fafc;
}

.toolbar-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.icon-action {
  width: 32px;
  padding: 0;
}

.toolbar-btn.primary {
  color: #ffffff;
  background: #2563eb;
  border-color: #2563eb;
}

.toolbar-btn.publish {
  color: #ffffff;
  background: #0f766e;
  border-color: #0f766e;
}

.toolbar-btn.subtle {
  background: #f8fafc;
}

.divider {
  width: 1px;
  height: 22px;
  background: #dbe3ef;
}

.zoom-group {
  height: 32px;
  padding: 0 4px;
  border: 1px solid #dbe3ef;
  border-radius: 6px;
}

.zoom-group .icon-action {
  height: 24px;
  width: 24px;
  border: 0;
}

.zoom-group span {
  min-width: 42px;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  text-align: center;
}

.metric-strip {
  height: 48px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #dbe3ef;
  flex-shrink: 0;
}

.metric-card {
  min-width: 86px;
  height: 34px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #ffffff;
}

.metric-card.wide {
  min-width: 130px;
}

.metric-card span {
  color: #64748b;
  font-size: 10px;
}

.metric-card strong {
  color: #0f172a;
  font-size: 13px;
}

.clear-btn {
  margin-left: auto;
  color: #b91c1c;
  background: #fff7f7;
  border-color: #fecaca;
}

.editor-body {
  display: flex;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.panel-left,
.panel-right {
  flex-shrink: 0;
  overflow: hidden;
}

.panel-resize-handle {
  width: 5px;
  flex-shrink: 0;
  cursor: col-resize;
  background: transparent;
  transition: background 0.15s;
  z-index: 50;
}

.panel-resize-handle:hover {
  background: #93c5fd;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 15000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.56);
  backdrop-filter: blur(5px);
}

.modal-panel {
  width: 560px;
  max-height: 78vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  box-shadow: 0 20px 70px rgba(15, 23, 42, 0.28);
}

.modal-panel.wide,
.modal-panel.template-panel {
  width: 760px;
}

.modal-header {
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
}

.modal-body {
  min-height: 0;
  overflow-y: auto;
  padding: 18px;
}

.new-project-row {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.field-input {
  width: 100%;
  height: 34px;
  padding: 0 10px;
  border: 1px solid #dbe3ef;
  border-radius: 6px;
  color: #0f172a;
  background: #ffffff;
  outline: none;
}

.field-input:focus,
.inline-edit:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.action-btn.primary {
  color: #ffffff;
  background: #2563eb;
  border-color: #2563eb;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
}

.project-row.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.project-avatar {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  color: #ffffff;
  background: #0f766e;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 900;
}

.proj-info {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.proj-name {
  color: #0f172a;
  font-size: 13px;
  font-weight: 800;
}

.proj-meta {
  color: #64748b;
  font-size: 11px;
}

.proj-actions {
  display: flex;
  gap: 6px;
}

.small-btn {
  height: 28px;
  padding: 0 9px;
}

.small-btn.danger {
  color: #b91c1c;
  border-color: #fecaca;
  background: #fff7f7;
}

.inline-edit {
  height: 30px;
  padding: 0 8px;
  border: 1px solid #dbe3ef;
  border-radius: 6px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.template-card {
  height: auto;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  text-align: left;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
}

.template-card:hover {
  border-color: #2563eb;
  box-shadow: 0 10px 30px rgba(37, 99, 235, 0.1);
}

.tpl-thumb {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 900;
}

.tpl-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tpl-info strong {
  color: #0f172a;
  font-size: 14px;
}

.tpl-info small {
  color: #64748b;
  font-size: 12px;
}

.tpl-info em {
  width: fit-content;
  padding: 2px 7px;
  color: #0f766e;
  background: #ccfbf1;
  border-radius: 999px;
  font-size: 11px;
  font-style: normal;
}

.setting-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.setting-grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.setting-grid span {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
}

.switch-row {
  margin: 16px 0;
  color: #334155;
  font-size: 13px;
}

.quick-sizes,
.theme-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.theme-card {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.theme-card span {
  width: 42px;
  height: 34px;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
}

@media (max-width: 1100px) {
  .workbench-header {
    grid-template-columns: 1fr;
    height: auto;
    padding: 8px;
  }

  .header-center,
  .header-right {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .metric-strip {
    height: auto;
    flex-wrap: wrap;
  }
}
</style>
