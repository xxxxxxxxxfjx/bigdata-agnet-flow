<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ComponentPanel from '../components/lowcode/ComponentPanel.vue'
import CanvasArea from '../components/lowcode/CanvasArea.vue'
import StylePanel from '../components/lowcode/StylePanel.vue'
import PreviewModal from '../components/lowcode/PreviewModal.vue'
import PublishModal from '../components/lowcode/PublishModal.vue'
import { useCanvas } from '../composables/useCanvas.js'
import { useHistory } from '../composables/useHistory.js'
import { useAutosave } from '../composables/useAutosave.js'
import { useKeyboard } from '../composables/useKeyboard.js'
import { useAlignGuide } from '../composables/useAlignGuide.js'
import { SCREEN_TEMPLATES } from '../config/templates.js'

const router = useRouter()
const {
  components, selectedId, selectedIds, canvasStyle,
  selectComponent, deselectComponent, deleteSelected,
  copyToClipboard, pasteFromClipboard, duplicateComponent,
  updateComponentConfig, exportCanvas, importCanvas,
  updateCanvasStyle, updatePosition, updateSize,
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
const canvasScale = ref(1)
const newProjectName = ref('')
const editingProjectName = ref(null)
const editNameValue = ref('')

// Create default project if none exists
onMounted(() => {
  if (projects.value.length === 0) {
    createProject('我的第一个大屏', 'bigscreen')
  } else if (currentProjectId.value) {
    switchProject(currentProjectId.value)
  }
  startAutosave()
  setupBeforeUnload()
})

// Keyboard shortcuts
useKeyboard({
  onDelete: () => {
    if (selectedIds.value.length > 0) {
      deleteSelected()
    }
  },
  onUndo: () => handleUndo(),
  onRedo: () => handleRedo(),
  onCopy: () => copyToClipboard(selectedIds.value),
  onPaste: () => pasteFromClipboard(),
  onSave: () => {
    if (currentProjectId.value) {
      saveProject(currentProjectId.value, {
        components: components.value,
        canvasStyle: canvasStyle.value,
      })
    }
  },
  onDuplicate: () => {
    if (selectedId.value) duplicateComponent(selectedId.value)
  },
  onEscape: () => { deselectComponent(); showProjects.value = false; showTemplates.value = false },
})

// Snapshot before mutations
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

// Undo/Redo
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

// Export/Import
function handleExport() {
  const json = exportCanvas()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bigscreen-${Date.now()}.json`
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
      importCanvas(ev.target.result)
      clearHistory()
    }
    reader.readAsText(file)
  }
  input.click()
}

function handleClear() {
  components.value = []
  selectedId.value = null
  selectedIds.value = []
  clearHistory()
}

function handlePreview() { showPreview.value = true }

// Alignment functions
function alignSelected(type) {
  if (selectedIds.value.length < 2) return
  withHistory(() => {
    const comps = selectedIds.value.map((id) => components.value.find((c) => c.id === id)).filter(Boolean)
    const aligned = alignComponents(comps, type)
    aligned.forEach((c) => {
      updatePosition(c.id, c.x, c.y)
    })
  })
}

// Canvas resize
function handleCanvasResize(w, h) {
  updateCanvasStyle('width', w)
  updateCanvasStyle('height', h)
}

// Template loading
function loadTemplate(template) {
  withHistory(() => {
    components.value = template.components.map((c) => ({
      ...c,
      zIndex: c.zIndex || 1,
      visible: true,
      locked: false,
    }))
    if (template.canvasStyle) {
      canvasStyle.value = { ...canvasStyle.value, ...template.canvasStyle }
    }
  })
  showTemplates.value = false
}

// Project management
function handleCreateProject() {
  if (!newProjectName.value.trim()) return
  snapshotBeforeMutate()
  // Save current project first
  if (currentProjectId.value) {
    saveProject(currentProjectId.value, {
      components: components.value,
      canvasStyle: canvasStyle.value,
    })
  }
  createProject(newProjectName.value.trim())
  clearHistory()
  newProjectName.value = ''
}

function handleSwitchProject(id) {
  if (currentProjectId.value === id) return
  // Save current
  if (currentProjectId.value) {
    saveProject(currentProjectId.value, {
      components: components.value,
      canvasStyle: canvasStyle.value,
    })
  }
  snapshotBeforeMutate()
  switchProject(id)
  clearHistory()
}

function handleDeleteProject(id) {
  if (!confirm('确定要删除此项目吗？此操作不可恢复。')) return
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

// Auto-snapshot when component mutation occurs
function onComponentMutated() {
  snapshotBeforeMutate()
}
</script>

<template>
  <div class="lowcode-editor">
    <!-- Toolbar -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <button class="toolbar-btn" @click="router.push('/')">← 首页</button>
        <span class="toolbar-divider"></span>
        <button class="toolbar-btn" :disabled="!canUndo" @click="handleUndo">↩ 撤销</button>
        <button class="toolbar-btn" :disabled="!canRedo" @click="handleRedo">↪ 重做</button>
        <span class="toolbar-divider"></span>
        <span class="toolbar-info">组件: {{ components.length }}</span>
        <span v-if="isDirty" class="dirty-dot" title="有未保存的更改">●</span>
      </div>
      <div class="toolbar-center">
        <!-- Project selector -->
        <button class="toolbar-btn project-btn" @click="showProjects = !showProjects" title="项目管理">
          📁 {{ projects.find(p => p.id === currentProjectId)?.name || '未命名' }}
        </button>
        <span class="canvas-size">{{ canvasStyle.width }}×{{ canvasStyle.height }}</span>
        <!-- Canvas size quick set -->
        <select class="canvas-size-select" @change="(e) => { const [w,h] = e.target.value.split('x').map(Number); handleCanvasResize(w, h) }">
          <option value="">画布尺寸</option>
          <option value="1920x1080">1920×1080 (Full HD)</option>
          <option value="2560x1440">2560×1440 (2K)</option>
          <option value="3840x2160">3840×2160 (4K)</option>
        </select>
      </div>
      <div class="toolbar-right">
        <!-- Alignment tools -->
        <div class="align-group" v-if="selectedIds.length >= 2">
          <button class="toolbar-btn" @click="alignSelected('left')" title="左对齐">⊏</button>
          <button class="toolbar-btn" @click="alignSelected('centerH')" title="水平居中">≣</button>
          <button class="toolbar-btn" @click="alignSelected('right')" title="右对齐">⊐</button>
          <button class="toolbar-btn" @click="alignSelected('top')" title="顶对齐">⊓</button>
          <button class="toolbar-btn" @click="alignSelected('centerV')" title="垂直居中">⊜</button>
          <button class="toolbar-btn" @click="alignSelected('bottom')" title="底对齐">⊔</button>
          <button class="toolbar-btn" @click="alignSelected('distributeH')" title="水平等距">↔</button>
          <button class="toolbar-btn" @click="alignSelected('distributeV')" title="垂直等距">↕</button>
          <span class="toolbar-divider"></span>
        </div>
        <div class="zoom-controls">
          <button class="toolbar-btn" @click="canvasScale = Math.max(0.25, canvasScale - 0.1)">−</button>
          <span class="zoom-value">{{ Math.round(canvasScale * 100) }}%</span>
          <button class="toolbar-btn" @click="canvasScale = Math.min(2, canvasScale + 0.1)">+</button>
          <button class="toolbar-btn" @click="canvasScale = 1">⊡</button>
        </div>
        <span class="toolbar-divider"></span>
        <button class="toolbar-btn" @click="showTemplates = true" title="模板库">📋 模板</button>
        <button class="toolbar-btn" @click="handleImport">📂 导入</button>
        <button class="toolbar-btn" @click="handleExport">💾 导出</button>
        <button class="toolbar-btn danger" @click="handleClear">🗑️</button>
        <span class="toolbar-divider"></span>
        <button class="toolbar-btn primary" @click="handlePreview">👁️ 预览</button>
        <button class="toolbar-btn publish" @click="showPublish = true">📦 发布</button>
      </div>
    </div>

    <!-- Three-panel editor -->
    <div class="editor-body">
      <ComponentPanel />
      <CanvasArea
        :scale="canvasScale"
        @canvas-click="deselectComponent"
        @component-mutated="onComponentMutated"
      />
      <StylePanel />
    </div>

    <!-- Modals -->
    <PreviewModal v-if="showPreview" @close="showPreview = false" />
    <PublishModal v-if="showPublish" @close="showPublish = false" />

    <!-- Projects modal -->
    <div v-if="showProjects" class="modal-overlay" @click.self="showProjects = false">
      <div class="modal-panel wide">
        <div class="modal-header">
          <h3>📁 项目管理</h3>
          <button class="close-btn" @click="showProjects = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="new-project-row">
            <input
              v-model="newProjectName"
              type="text"
              class="field-input"
              placeholder="新建项目名称..."
              @keyup.enter="handleCreateProject"
            />
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
              <span class="proj-icon">{{ p.type === 'bigscreen' ? '📊' : '⚡' }}</span>
              <div class="proj-info">
                <template v-if="editingProjectName === p.id">
                  <input
                    v-model="editNameValue"
                    class="inline-edit"
                    @blur="confirmRename"
                    @keyup.enter="confirmRename"
                    @click.stop
                    autofocus
                  />
                </template>
                <template v-else>
                  <span class="proj-name">{{ p.name }}</span>
                  <span class="proj-meta">{{ p.componentCount || 0 }} 组件 · {{ new Date(p.updatedAt).toLocaleDateString() }}</span>
                </template>
              </div>
              <div class="proj-actions" @click.stop>
                <button class="icon-btn" @click="startRename(p.id)" title="重命名">✏️</button>
                <button class="icon-btn danger" @click="handleDeleteProject(p.id)" title="删除">🗑️</button>
              </div>
            </div>
            <div v-if="projects.length === 0" class="empty-list">暂无项目，请新建</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Templates modal -->
    <div v-if="showTemplates" class="modal-overlay" @click.self="showTemplates = false">
      <div class="modal-panel wide">
        <div class="modal-header">
          <h3>📋 模板库</h3>
          <button class="close-btn" @click="showTemplates = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="template-grid">
            <div
              v-for="tpl in SCREEN_TEMPLATES"
              :key="tpl.id"
              class="template-card"
              @click="loadTemplate(tpl)"
            >
              <div class="tpl-thumb">{{ tpl.thumbnail }}</div>
              <div class="tpl-info">
                <span class="tpl-name">{{ tpl.name }}</span>
                <span class="tpl-desc">{{ tpl.description }}</span>
                <span class="tpl-category">{{ tpl.category }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Layout */
.lowcode-editor { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.editor-body { display: flex; flex: 1; overflow: hidden; }

/* Toolbar */
.editor-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  height: 40px; padding: 0 10px; background: #ffffff;
  border-bottom: 1px solid #e2e8f0; flex-shrink: 0; gap: 6px;
}
.toolbar-left, .toolbar-center, .toolbar-right {
  display: flex; align-items: center; gap: 4px;
}
.toolbar-center {
  position: absolute; left: 50%; transform: translateX(-50%); gap: 10px;
}

.toolbar-btn {
  display: flex; align-items: center; gap: 4px; padding: 5px 10px;
  font-size: 12px; font-weight: 500; color: #475569; background: #fafbfc;
  border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer;
  transition: all 0.15s; white-space: nowrap;
}
.toolbar-btn:hover:not(:disabled) { background: #f1f5f9; border-color: #cbd5e1; }
.toolbar-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.toolbar-btn.primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff;
  border-color: transparent; box-shadow: 0 2px 6px rgba(99,102,241,0.25);
}
.toolbar-btn.primary:hover { box-shadow: 0 3px 10px rgba(99,102,241,0.35); }
.toolbar-btn.publish {
  background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff;
  border-color: transparent; box-shadow: 0 2px 6px rgba(245,158,11,0.25);
}
.toolbar-btn.publish:hover { box-shadow: 0 3px 10px rgba(245,158,11,0.35); }
.toolbar-btn.danger:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
.toolbar-btn.project-btn { font-weight: 600; max-width: 180px; overflow: hidden; text-overflow: ellipsis; }
.toolbar-divider { width: 1px; height: 20px; background: #e2e8f0; }
.toolbar-info { font-size: 11px; color: #94a3b8; padding: 0 4px; }
.dirty-dot { color: #f59e0b; font-size: 10px; animation: pulse 1s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

.align-group { display: flex; gap: 2px; }

.zoom-controls { display: flex; align-items: center; gap: 2px; }
.zoom-value { font-size: 11px; font-weight: 500; color: #64748b; min-width: 38px; text-align: center; }

.canvas-size { font-size: 11px; color: #94a3b8; font-family: monospace; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; }
.canvas-size-select {
  font-size: 11px; color: #64748b; background: #fafbfc; border: 1px solid #e2e8f0;
  border-radius: 4px; padding: 3px 6px; cursor: pointer;
}

/* Modal */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 15000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
}
.modal-panel {
  background: #fff; border-radius: 14px; box-shadow: 0 16px 48px rgba(0,0,0,0.25);
  max-height: 75vh; display: flex; flex-direction: column; overflow: hidden;
}
.modal-panel.wide { width: 640px; }
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 22px; border-bottom: 1px solid #e2e8f0;
}
.modal-header h3 { margin: 0; font-size: 16px; }
.close-btn { background: none; border: none; font-size: 18px; color: #94a3b8; cursor: pointer; padding: 4px 8px; border-radius: 6px; }
.close-btn:hover { background: #f1f5f9; }
.modal-body { flex: 1; overflow-y: auto; padding: 20px 22px; }

/* Projects */
.new-project-row { display: flex; gap: 8px; margin-bottom: 16px; }
.action-btn {
  padding: 8px 16px; font-size: 12px; font-weight: 600; color: #475569;
  background: #f1f5f9; border: 1.5px solid #e2e8f0; border-radius: 8px; cursor: pointer;
  white-space: nowrap;
}
.action-btn.primary { background: #6366f1; color: #fff; border-color: transparent; }
.project-list { display: flex; flex-direction: column; gap: 4px; max-height: 400px; overflow-y: auto; }
.project-row {
  display: flex; align-items: center; gap: 12px; padding: 10px 12px;
  border-radius: 8px; cursor: pointer; transition: all 0.15s;
}
.project-row:hover { background: #f8fafc; }
.project-row.active { background: #eef2ff; border: 1px solid #c7d2fe; }
.proj-icon { font-size: 20px; }
.proj-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.proj-name { font-size: 13px; font-weight: 600; color: #1e293b; }
.proj-meta { font-size: 11px; color: #94a3b8; }
.proj-actions { display: flex; gap: 4px; }
.icon-btn { background: none; border: none; font-size: 14px; cursor: pointer; padding: 4px 6px; border-radius: 4px; }
.icon-btn:hover { background: #f1f5f9; }
.icon-btn.danger:hover { background: #fef2f2; }
.inline-edit { font-size: 13px; padding: 2px 6px; border: 1px solid #6366f1; border-radius: 4px; width: 100%; }
.empty-list { text-align: center; padding: 24px; color: #94a3b8; font-size: 13px; }
.field-input {
  flex: 1; padding: 8px 12px; font-size: 13px; border: 1.5px solid #e2e8f0;
  border-radius: 8px; background: #fafbfc; outline: none;
}
.field-input:focus { border-color: #6366f1; }

/* Templates */
.template-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.template-card {
  display: flex; gap: 14px; padding: 16px; border-radius: 12px;
  border: 1.5px solid #e2e8f0; cursor: pointer; transition: all 0.2s;
}
.template-card:hover { border-color: #6366f1; box-shadow: 0 4px 16px rgba(99,102,241,0.1); transform: translateY(-1px); }
.tpl-thumb { font-size: 40px; line-height: 1; flex-shrink: 0; }
.tpl-info { display: flex; flex-direction: column; gap: 2px; }
.tpl-name { font-size: 14px; font-weight: 600; color: #1e293b; }
.tpl-desc { font-size: 12px; color: #64748b; }
.tpl-category { font-size: 10px; color: #94a3b8; background: #f1f5f9; padding: 2px 8px; border-radius: 8px; align-self: flex-start; margin-top: 4px; }
</style>
