<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { SCREEN_TEMPLATES } from '../config/templates.js'

const router = useRouter()
const projects = ref([])
const showNewDialog = ref(false)
const newProject = ref({ name: '', description: '', category: '经营分析' })

// Filter & sort state
const searchQuery = ref('')
const activeCategory = ref('全部')
const sortBy = ref('updatedAt')

const STORAGE_KEY = 'bigdata_agent_flow_projects'
const PROJECT_DATA_PREFIX = 'bigdata_agent_flow_project_'

// Collect all unique categories
const categories = computed(() => {
  const cats = new Set()
  projects.value.forEach((p) => cats.add(p.category))
  return ['全部', ...Array.from(cats).sort()]
})

// Parse canvas size from stored project data
function getProjectMeta(id) {
  try {
    const key = PROJECT_DATA_PREFIX + id
    const data = JSON.parse(localStorage.getItem(key))
    if (data) {
      return {
        canvasWidth: data.canvasStyle?.width || 1920,
        canvasHeight: data.canvasStyle?.height || 1080,
        componentCount: data.components?.length || 0,
      }
    }
  } catch { /* ignore */ }
  return { canvasWidth: 1920, canvasHeight: 1080, componentCount: 0 }
}

// Filtered and sorted projects
const filteredProjects = computed(() => {
  let result = [...projects.value]

  // Search filter
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    result = result.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    )
  }

  // Category filter
  if (activeCategory.value !== '全部') {
    result = result.filter((p) => p.category === activeCategory.value)
  }

  // Sort
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name, 'zh-CN')
      case 'componentCount':
        return (b.componentCount || 0) - (a.componentCount || 0)
      case 'createdAt':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      case 'updatedAt':
      default:
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    }
  })

  // Templates first
  const templates = result.filter((p) => p.isTemplate)
  const user = result.filter((p) => !p.isTemplate)
  return [...templates, ...user]
})

function loadProjects() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')

    // Map templates from SCREEN_TEMPLATES
    const templateIds = new Set(SCREEN_TEMPLATES.map((t) => t.id))
    const templates = SCREEN_TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      thumbnail: t.thumbnail || 'BI',
      isTemplate: true,
      componentCount: t.components?.length || 0,
      canvasWidth: t.canvasStyle?.width || 1920,
      canvasHeight: t.canvasStyle?.height || 1080,
      createdAt: '2024-06-15T08:00:00Z',
      updatedAt: '2024-07-01T10:30:00Z',
    }))

    // Split user projects
    const editedTemplates = []
    const pureUserProjects = []
    const seenIds = new Set()

    saved.forEach((p) => {
      if (!p.id) return
      if (seenIds.has(p.id)) return
      seenIds.add(p.id)

      // Enrich with canvas meta from stored project data
      const meta = getProjectMeta(p.id)
      const enriched = { ...p, ...meta }

      if (templateIds.has(p.id)) {
        editedTemplates.push({ ...enriched, isTemplate: false, isEditedTemplate: true })
      } else {
        pureUserProjects.push({ ...enriched, isTemplate: false })
      }
    })

    // Build final list: remaining templates + edited templates + user projects
    const remainingTemplates = templates.filter((t) => !seenIds.has(t.id))
    projects.value = [...remainingTemplates, ...editedTemplates, ...pureUserProjects]
  } catch {
    projects.value = SCREEN_TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      thumbnail: t.thumbnail || 'BI',
      isTemplate: true,
      componentCount: t.components?.length || 0,
      canvasWidth: t.canvasStyle?.width || 1920,
      canvasHeight: t.canvasStyle?.height || 1080,
      createdAt: '2024-06-15T08:00:00Z',
      updatedAt: '2024-07-01T10:30:00Z',
    }))
  }
}

function setCategory(cat) {
  activeCategory.value = cat
}

function clearFilters() {
  searchQuery.value = ''
  activeCategory.value = '全部'
  sortBy.value = 'updatedAt'
}

function saveProjectsList() {
  const userProjects = projects.value.filter((p) => !p.isTemplate)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userProjects))
}

function createProject() {
  if (!newProject.value.name.trim()) return
  const id = 'proj_' + Date.now()
  const now = new Date().toISOString()
  const proj = {
    id,
    name: newProject.value.name.trim(),
    description: newProject.value.description.trim(),
    category: newProject.value.category,
    type: 'bigscreen',
    componentCount: 0,
    canvasWidth: 1920,
    canvasHeight: 1080,
    createdAt: now,
    updatedAt: now,
    isTemplate: false,
  }
  projects.value.push(proj)
  saveProjectsList()

  // Initialize empty project data
  const key = PROJECT_DATA_PREFIX + id
  localStorage.setItem(key, JSON.stringify({
    components: [],
    canvasStyle: { width: 1920, height: 1080, background: '#0f172a', scaleMode: 'full', gridSize: 10, showGrid: true },
  }))

  showNewDialog.value = false
  newProject.value = { name: '', description: '', category: '经营分析' }
  // Enter editor
  router.push(`/lowcode/${id}`)
}

function deleteProject(id) {
  if (!confirm('确定要删除此大屏项目吗？')) return
  // Remove project data
  const key = PROJECT_DATA_PREFIX + id
  localStorage.removeItem(key)
  // Remove from list
  projects.value = projects.value.filter((p) => p.id !== id)
  saveProjectsList()
}

function enterEditor(proj) {
  // For templates, create a copy first
  if (proj.isTemplate) {
    const template = SCREEN_TEMPLATES.find((t) => t.id === proj.id)
    if (!template) return

    const id = 'proj_' + Date.now()
    const now = new Date().toISOString()
    const newProj = {
      id,
      name: proj.name + ' (副本)',
      description: proj.description,
      category: proj.category,
      type: 'bigscreen',
      componentCount: proj.componentCount,
      canvasWidth: proj.canvasWidth,
      canvasHeight: proj.canvasHeight,
      createdAt: now,
      updatedAt: now,
      isTemplate: false,
    }
    projects.value.push(newProj)
    saveProjectsList()

    // Copy template data
    const key = PROJECT_DATA_PREFIX + id
    localStorage.setItem(key, JSON.stringify({
      components: template.components || [],
      canvasStyle: template.canvasStyle || { width: 1920, height: 1080, background: '#0f172a', gridSize: 10, showGrid: true },
    }))

    router.push(`/lowcode/${id}`)
    return
  }

  // Save current project ID for the editor
  localStorage.setItem('bigdata_agent_flow_current_project', proj.id)
  router.push(`/lowcode/${proj.id}`)
}

function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function categoryColor(cat) {
  const map = {
    '经营分析': '#3b82f6',
    '政务': '#8b5cf6',
    '工业': '#06b6d4',
    '通用': '#64748b',
  }
  return map[cat] || '#94a3b8'
}

onMounted(loadProjects)
</script>

<template>
  <div class="lowcode-list-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="router.push('/')">← 首页</button>
        <div class="header-title">
          <h1>▦ 可视化大屏</h1>
          <span class="header-sub">
            共 {{ filteredProjects.length }} 个大屏项目
            <template v-if="searchQuery || activeCategory !== '全部'">
              / 总计 {{ projects.length }}
            </template>
          </span>
        </div>
      </div>
      <button class="create-btn" @click="showNewDialog = true">
        + 新建大屏
      </button>
    </div>

    <!-- Filter bar -->
    <div class="filter-bar">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="搜索大屏名称、描述、分类..."
        />
        <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">✕</button>
      </div>
      <select v-model="sortBy" class="sort-select">
        <option value="updatedAt">最近更新</option>
        <option value="createdAt">最近创建</option>
        <option value="name">名称排序</option>
        <option value="componentCount">组件数量</option>
      </select>
      <span class="filter-divider"></span>
      <div class="filter-tags">
        <button
          v-for="cat in categories"
          :key="cat"
          class="filter-tag"
          :class="{ active: activeCategory === cat }"
          @click="setCategory(cat)"
        >{{ cat }}</button>
      </div>
      <button
        v-if="searchQuery || activeCategory !== '全部'"
        class="clear-filter-btn"
        @click="clearFilters"
      >清除筛选</button>
    </div>

    <!-- Filter stats -->
    <div class="filter-stats">
      <span>共 <strong>{{ filteredProjects.length }}</strong> 个大屏项目</span>
      <span v-if="searchQuery || activeCategory !== '全部'" class="filter-active-hint">
        （已筛选，共 {{ projects.length }} 个）
      </span>
    </div>

    <!-- Project grid -->
    <div v-if="filteredProjects.length > 0" class="project-grid">
      <div
        v-for="proj in filteredProjects"
        :key="proj.id"
        class="proj-card"
        @click="enterEditor(proj)"
      >
        <!-- Card top accent -->
        <div class="card-accent" :style="{ background: categoryColor(proj.category) }"></div>

        <!-- Card body -->
        <div class="card-body">
          <div class="card-thumb">{{ proj.thumbnail || '▦' }}</div>
          <div class="card-info">
            <h3 class="card-name">{{ proj.name }}</h3>
            <p class="card-desc">{{ proj.description }}</p>
          </div>
        </div>

        <!-- Card footer -->
        <div class="card-footer">
          <span class="card-category" :style="{ color: categoryColor(proj.category), background: categoryColor(proj.category) + '15' }">
            {{ proj.category }}
          </span>
          <div class="card-meta">
            <span class="meta-item" v-if="proj.componentCount > 0">
              {{ proj.componentCount }} 个组件
            </span>
            <span class="meta-item" v-if="proj.canvasWidth && proj.canvasHeight">
              {{ proj.canvasWidth }}×{{ proj.canvasHeight }}
            </span>
            <span class="meta-item" v-if="proj.isTemplate">📋 模板</span>
            <span class="meta-item edited-tag" v-if="proj.isEditedTemplate">✏️ 已编辑</span>
            <span class="meta-item">{{ formatDate(proj.updatedAt) }}</span>
          </div>
          <div class="card-actions" @click.stop>
            <button
              v-if="!proj.isTemplate"
              class="card-action-btn danger"
              @click="deleteProject(proj.id)"
              title="删除"
            >🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state (filters active, nothing matches) -->
    <div v-if="filteredProjects.length === 0 && projects.length > 0" class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3>未找到匹配的大屏项目</h3>
      <p>尝试调整搜索条件或筛选分类</p>
      <button class="clear-filter-btn" @click="clearFilters">清除所有筛选</button>
    </div>

    <!-- Empty state (no projects at all) -->
    <div v-if="projects.length === 0" class="empty-state">
      <div class="empty-icon">▦</div>
      <h3>暂无大屏项目</h3>
      <p>点击"新建大屏"开始创建你的第一个可视化大屏</p>
    </div>

    <!-- New project dialog -->
    <div v-if="showNewDialog" class="dialog-overlay" @click.self="showNewDialog = false">
      <div class="dialog-panel">
        <h3>新建大屏项目</h3>
        <div class="dialog-body">
          <div class="field">
            <label class="field-label">名称 *</label>
            <input
              v-model="newProject.name"
              type="text"
              class="field-input"
              placeholder="输入大屏项目名称..."
              @keyup.enter="createProject"
              autofocus
            />
          </div>
          <div class="field">
            <label class="field-label">描述</label>
            <textarea
              v-model="newProject.description"
              class="field-textarea"
              placeholder="简要描述此大屏的用途..."
              rows="3"
            ></textarea>
          </div>
          <div class="field">
            <label class="field-label">分类</label>
            <select v-model="newProject.category" class="field-input">
              <option value="经营分析">经营分析</option>
              <option value="政务">政务</option>
              <option value="工业">工业</option>
              <option value="通用">通用</option>
            </select>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="dialog-btn cancel" @click="showNewDialog = false">取消</button>
          <button class="dialog-btn primary" @click="createProject" :disabled="!newProject.name.trim()">
            创建并进入编辑
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lowcode-list-page {
  flex: 1;
  overflow-y: auto;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 32px 40px;
}

/* Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-left { display: flex; align-items: flex-start; gap: 16px; }

.back-btn {
  display: flex; align-items: center; gap: 5px; padding: 7px 14px;
  font-size: 13px; font-weight: 500; color: #0f766e; background: #f0fdfa;
  border: none; border-radius: 8px; cursor: pointer; white-space: nowrap;
  margin-top: 6px;
}
.back-btn:hover { background: #ccfbf1; }

.header-title h1 { margin: 0; font-size: 24px; font-weight: 800; color: #1e293b; }
.header-sub { font-size: 13px; color: #94a3b8; margin-top: 2px; display: block; }

.create-btn {
  display: flex; align-items: center; gap: 6px; padding: 10px 20px;
  font-size: 14px; font-weight: 600; color: #fff; border: none; border-radius: 10px;
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  box-shadow: 0 4px 12px rgba(15,118,110,0.3); cursor: pointer;
  transition: all 0.2s;
}
.create-btn:hover { box-shadow: 0 6px 20px rgba(15,118,110,0.4); transform: translateY(-1px); }

/* Filter bar */
.filter-bar {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  margin-bottom: 24px; padding: 14px 18px;
  background: #fff; border-radius: 12px; border: 1px solid #e2e8f0;
}
.search-wrap {
  position: relative; display: flex; align-items: center;
  max-width: 320px; flex: 1;
}
.search-icon { position: absolute; left: 10px; font-size: 13px; pointer-events: none; }
.search-input {
  width: 100%; padding: 8px 32px 8px 32px; font-size: 13px;
  border: 1.5px solid #e2e8f0; border-radius: 8px; outline: none;
  background: #fafbfc;
}
.search-input:focus { border-color: #0f766e; }
.search-clear {
  position: absolute; right: 8px; background: #cbd5e1; border: none;
  color: #fff; width: 18px; height: 18px; border-radius: 50%;
  font-size: 10px; cursor: pointer; display: flex; align-items: center;
  justify-content: center;
}
.search-clear:hover { background: #94a3b8; }

.sort-select {
  padding: 6px 10px; font-size: 12px; color: #475569;
  background: #fafbfc; border: 1.5px solid #e2e8f0; border-radius: 8px;
  outline: none; cursor: pointer;
}
.sort-select:focus { border-color: #0f766e; }

.filter-divider { width: 1px; height: 24px; background: #e2e8f0; }

.filter-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.filter-tag {
  padding: 6px 16px; font-size: 12px; font-weight: 500; color: #64748b;
  background: #f1f5f9; border: 1.5px solid transparent; border-radius: 20px;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.filter-tag:hover { background: #e2e8f0; border-color: #cbd5e1; }
.filter-tag.active {
  background: #f0fdfa; color: #0f766e; border-color: #99f6e4;
  font-weight: 600;
}

.clear-filter-btn {
  padding: 6px 14px; font-size: 12px; font-weight: 500; color: #ef4444;
  background: #fef2f2; border: 1px solid #fecaca; border-radius: 20px;
  cursor: pointer; white-space: nowrap; transition: all 0.15s;
}
.clear-filter-btn:hover { background: #fee2e2; }

/* Filter stats */
.filter-stats {
  margin-bottom: 18px; font-size: 13px; color: #64748b;
  display: flex; align-items: center; gap: 8px;
}
.filter-stats strong { color: #1e293b; }
.filter-active-hint { color: #94a3b8; font-size: 12px; }

/* Grid */
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

/* Card */
.proj-card {
  background: #fff; border-radius: 14px; border: 1.5px solid #e2e8f0;
  overflow: hidden; cursor: pointer;
  transition: all 0.25s ease; position: relative;
}
.proj-card:hover {
  border-color: #99f6e4; box-shadow: 0 8px 28px rgba(0,0,0,0.1);
  transform: translateY(-3px);
}
.card-accent { height: 4px; }
.card-body { display: flex; gap: 14px; padding: 20px 20px 12px; }
.card-thumb {
  font-size: 36px; line-height: 1; flex-shrink: 0;
  width: 52px; height: 52px; display: flex; align-items: center;
  justify-content: center; border-radius: 10px;
  background: linear-gradient(135deg, #f0fdfa, #ccfbf1);
  color: #0f766e;
}
.card-info { flex: 1; min-width: 0; }
.card-name { margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #1e293b; }
.card-desc { margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px 16px; flex-wrap: wrap;
}
.card-category {
  font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 12px;
}
.card-meta { display: flex; gap: 12px; flex: 1; }
.meta-item { font-size: 11px; color: #94a3b8; }
.meta-item.edited-tag { color: #f59e0b; font-weight: 500; }
.card-actions { margin-left: auto; }
.card-action-btn {
  background: none; border: 1px solid #fecaca; border-radius: 6px;
  padding: 4px 8px; cursor: pointer; font-size: 14px; opacity: 0;
  transition: all 0.15s;
}
.proj-card:hover .card-action-btn { opacity: 1; }
.card-action-btn:hover { background: #fef2f2; border-color: #f87171; }

/* Empty */
.empty-state { text-align: center; padding: 80px 20px; }
.empty-icon { font-size: 72px; opacity: 0.3; margin-bottom: 16px; }
.empty-state h3 { font-size: 20px; color: #64748b; margin: 0 0 8px; }
.empty-state p { font-size: 14px; color: #94a3b8; }

/* Dialog */
.dialog-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 20000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
}
.dialog-panel {
  width: 460px; background: #fff; border-radius: 16px; padding: 28px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.dialog-panel h3 { margin: 0 0 20px; font-size: 18px; color: #1e293b; }
.dialog-body { display: flex; flex-direction: column; gap: 14px; }
.field-label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px; }
.field-input {
  width: 100%; padding: 9px 12px; font-size: 13px; border: 1.5px solid #e2e8f0;
  border-radius: 8px; outline: none; box-sizing: border-box;
}
.field-input:focus { border-color: #0f766e; box-shadow: 0 0 0 3px rgba(15,118,110,0.1); }
.field-textarea {
  width: 100%; padding: 9px 12px; font-size: 13px; border: 1.5px solid #e2e8f0;
  border-radius: 8px; outline: none; resize: vertical; box-sizing: border-box;
  font-family: inherit;
}
.field-textarea:focus { border-color: #0f766e; box-shadow: 0 0 0 3px rgba(15,118,110,0.1); }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
.dialog-btn {
  padding: 9px 20px; font-size: 13px; font-weight: 600; border: none; border-radius: 8px;
  cursor: pointer; transition: all 0.15s;
}
.dialog-btn.cancel { background: #f1f5f9; color: #475569; }
.dialog-btn.cancel:hover { background: #e2e8f0; }
.dialog-btn.primary { background: #0f766e; color: #fff; }
.dialog-btn.primary:hover:not(:disabled) { background: #115e59; }
.dialog-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
