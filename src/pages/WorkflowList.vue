<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { WORKFLOW_TEMPLATES } from '../config/workflowTemplates.js'

const router = useRouter()
const workflows = ref([])
const showNewDialog = ref(false)
const newWorkflow = ref({ name: '', description: '', category: '通用' })

// Filter & sort state
const searchQuery = ref('')
const activeCategory = ref('全部')
const sortBy = ref('updatedAt') // 'updatedAt' | 'name' | 'nodeCount' | 'createdAt'

const STORAGE_KEY = 'bigdata_agent_flow_workflows'

// Collect all unique categories
const categories = computed(() => {
  const cats = new Set()
  workflows.value.forEach((w) => cats.add(w.category))
  return ['全部', ...Array.from(cats).sort()]
})

// Filtered and sorted workflows
const filteredWorkflows = computed(() => {
  let result = [...workflows.value]

  // Search filter: match name or description
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    result = result.filter((w) =>
      w.name.toLowerCase().includes(q) ||
      (w.description || '').toLowerCase().includes(q) ||
      (w.category || '').toLowerCase().includes(q)
    )
  }

  // Category filter
  if (activeCategory.value !== '全部') {
    result = result.filter((w) => w.category === activeCategory.value)
  }

  // Sort
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name, 'zh-CN')
      case 'nodeCount':
        return (b.nodeCount || 0) - (a.nodeCount || 0)
      case 'createdAt':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      case 'updatedAt':
      default:
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    }
  })

  // Templates first
  const templates = result.filter((w) => w.isTemplate)
  const user = result.filter((w) => !w.isTemplate)
  return [...templates, ...user]
})

function loadWorkflows() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')

    // Map templates
    const templateIds = new Set(WORKFLOW_TEMPLATES.map((t) => t.id))
    const templates = WORKFLOW_TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      icon: t.icon || '⚡',
      isTemplate: true,
      nodeCount: t.nodes?.length || 0,
      createdAt: '2024-06-15T08:00:00Z',
      updatedAt: '2024-07-01T10:30:00Z',
      nodes: t.nodes,
      edges: t.edges,
    }))

    // Split user workflows: duplicates of templates vs. truly new ones
    const editedTemplates = []
    const pureUserWorkflows = []
    const seenIds = new Set()

    saved.forEach((w) => {
      // Skip completely empty or corrupted entries
      if (!w.id) return
      // Dedup: first occurrence wins
      if (seenIds.has(w.id)) return
      seenIds.add(w.id)

      if (templateIds.has(w.id)) {
        // User edited a template — show user version, mark as edited
        editedTemplates.push({ ...w, isTemplate: false, isEditedTemplate: true })
      } else {
        pureUserWorkflows.push({ ...w, isTemplate: false })
      }
    })

    // Build final list:
    // 1. Templates (skip those the user has edited — the edited version replaces them)
    const remainingTemplates = templates.filter((t) => !seenIds.has(t.id))
    // 2. Edited templates (user's versions of template workflows)
    // 3. Pure user-created workflows
    workflows.value = [...remainingTemplates, ...editedTemplates, ...pureUserWorkflows]
  } catch {
    workflows.value = WORKFLOW_TEMPLATES.map((t) => ({
      id: t.id, name: t.name, description: t.description,
      category: t.category, icon: t.icon || '⚡',
      isTemplate: true, nodeCount: t.nodes?.length || 0,
      createdAt: '2024-06-15T08:00:00Z', updatedAt: '2024-07-01T10:30:00Z',
      nodes: t.nodes, edges: t.edges,
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

function saveWorkflows() {
  const userWorkflows = workflows.value.filter((w) => !w.isTemplate)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userWorkflows))
}

function createWorkflow() {
  if (!newWorkflow.value.name.trim()) return
  const id = 'wf_' + Date.now()
  const now = new Date().toISOString()
  const wf = {
    id,
    name: newWorkflow.value.name.trim(),
    description: newWorkflow.value.description.trim(),
    category: newWorkflow.value.category,
    icon: '⚡',
    nodeCount: 0,
    nodes: [],
    edges: [],
    createdAt: now,
    updatedAt: now,
    isTemplate: false,
  }
  workflows.value.push(wf)
  saveWorkflows()
  showNewDialog.value = false
  newWorkflow.value = { name: '', description: '', category: '通用' }
  // Enter editor
  router.push(`/workflow/${id}`)
}

function deleteWorkflow(id) {
  if (!confirm('确定要删除此工作流吗？')) return
  workflows.value = workflows.value.filter((w) => w.id !== id)
  saveWorkflows()
}

function enterWorkflow(wf) {
  // Save workflow data into localStorage so editor can load it
  const data = {
    id: wf.id,
    name: wf.name,
    nodes: wf.nodes || [],
    edges: wf.edges || [],
    isTemplate: wf.isTemplate || false,
  }
  localStorage.setItem('bigdata_agent_flow_current_workflow', JSON.stringify(data))
  router.push(`/workflow/${wf.id}`)
}

function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function categoryColor(cat) {
  const map = {
    '数据处理': '#3b82f6', 'AI Agent': '#8b5cf6', '实时计算': '#06b6d4',
    'AI/ML': '#ec4899', '通用': '#64748b',
  }
  return map[cat] || '#94a3b8'
}

onMounted(loadWorkflows)
</script>

<template>
  <div class="workflow-list-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="router.push('/')">← 首页</button>
        <div class="header-title">
          <h1>⚡ 工作流编排</h1>
          <span class="header-sub">
            共 {{ filteredWorkflows.length }} 个工作流
            <template v-if="searchQuery || activeCategory !== '全部'">
              / 总计 {{ workflows.length }}
            </template>
          </span>
        </div>
      </div>
      <button class="create-btn" @click="showNewDialog = true">
        + 新建工作流
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
          placeholder="搜索工作流名称、描述、分类..."
        />
        <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">✕</button>
      </div>
      <select v-model="sortBy" class="sort-select">
        <option value="updatedAt">最近更新</option>
        <option value="createdAt">最近创建</option>
        <option value="name">名称排序</option>
        <option value="nodeCount">节点数量</option>
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
      <span>共 <strong>{{ filteredWorkflows.length }}</strong> 个工作流</span>
      <span v-if="searchQuery || activeCategory !== '全部'" class="filter-active-hint">
        （已筛选，共 {{ workflows.length }} 个）
      </span>
    </div>

    <!-- Workflow grid -->
    <div v-if="filteredWorkflows.length > 0" class="workflow-grid">
      <div
        v-for="wf in filteredWorkflows"
        :key="wf.id"
        class="wf-card"
        @click="enterWorkflow(wf)"
      >
        <!-- Card top accent -->
        <div class="card-accent" :style="{ background: categoryColor(wf.category) }"></div>

        <!-- Card body -->
        <div class="card-body">
          <div class="card-icon">{{ wf.icon || '⚡' }}</div>
          <div class="card-info">
            <h3 class="card-name">{{ wf.name }}</h3>
            <p class="card-desc">{{ wf.description }}</p>
          </div>
        </div>

        <!-- Card footer -->
        <div class="card-footer">
          <span class="card-category" :style="{ color: categoryColor(wf.category), background: categoryColor(wf.category) + '15' }">
            {{ wf.category }}
          </span>
          <div class="card-meta">
            <span class="meta-item" v-if="wf.nodeCount > 0">
              {{ wf.nodeCount }} 个节点
            </span>
            <span class="meta-item" v-if="wf.isTemplate">📋 模板</span>
            <span class="meta-item edited-tag" v-if="wf.isEditedTemplate">✏️ 已编辑</span>
            <span class="meta-item">{{ formatDate(wf.updatedAt) }}</span>
          </div>
          <div class="card-actions" @click.stop>
            <button
              v-if="!wf.isTemplate"
              class="card-action-btn danger"
              @click="deleteWorkflow(wf.id)"
              title="删除"
            >🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- No results (filters active but nothing matches) -->
    <div v-if="filteredWorkflows.length === 0 && workflows.length > 0" class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3>未找到匹配的工作流</h3>
      <p>尝试调整搜索条件或筛选分类</p>
      <button class="clear-filter-btn" @click="clearFilters">清除所有筛选</button>
    </div>

    <!-- Empty state (no workflows at all) -->
    <div v-if="workflows.length === 0" class="empty-state">
      <div class="empty-icon">⚡</div>
      <h3>暂无工作流</h3>
      <p>点击"新建工作流"开始创建你的第一个 Agent 工作流</p>
    </div>

    <!-- New workflow dialog -->
    <div v-if="showNewDialog" class="dialog-overlay" @click.self="showNewDialog = false">
      <div class="dialog-panel">
        <h3>新建工作流</h3>
        <div class="dialog-body">
          <div class="field">
            <label class="field-label">名称 *</label>
            <input
              v-model="newWorkflow.name"
              type="text"
              class="field-input"
              placeholder="输入工作流名称..."
              @keyup.enter="createWorkflow"
              autofocus
            />
          </div>
          <div class="field">
            <label class="field-label">描述</label>
            <textarea
              v-model="newWorkflow.description"
              class="field-textarea"
              placeholder="简要描述此工作流的用途..."
              rows="3"
            ></textarea>
          </div>
          <div class="field">
            <label class="field-label">分类</label>
            <select v-model="newWorkflow.category" class="field-input">
              <option value="通用">通用</option>
              <option value="数据处理">数据处理</option>
              <option value="AI Agent">AI Agent</option>
              <option value="实时计算">实时计算</option>
              <option value="AI/ML">AI/ML</option>
            </select>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="dialog-btn cancel" @click="showNewDialog = false">取消</button>
          <button class="dialog-btn primary" @click="createWorkflow" :disabled="!newWorkflow.name.trim()">
            创建并进入编辑
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workflow-list-page {
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
  font-size: 13px; font-weight: 500; color: #6366f1; background: #eef2ff;
  border: none; border-radius: 8px; cursor: pointer; white-space: nowrap;
  margin-top: 6px;
}
.back-btn:hover { background: #e0e7ff; }

.header-title h1 { margin: 0; font-size: 24px; font-weight: 800; color: #1e293b; }
.header-sub { font-size: 13px; color: #94a3b8; margin-top: 2px; display: block; }

.create-btn {
  display: flex; align-items: center; gap: 6px; padding: 10px 20px;
  font-size: 14px; font-weight: 600; color: #fff; border: none; border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 4px 12px rgba(99,102,241,0.3); cursor: pointer;
  transition: all 0.2s;
}
.create-btn:hover { box-shadow: 0 6px 20px rgba(99,102,241,0.4); transform: translateY(-1px); }

/* Filter bar */
.filter-bar {
  display: flex; align-items: center; gap: 16px;
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
.search-input:focus { border-color: #6366f1; }
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
.sort-select:focus { border-color: #6366f1; }

.filter-divider { width: 1px; height: 24px; background: #e2e8f0; }

.filter-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.filter-tag {
  padding: 6px 16px; font-size: 12px; font-weight: 500; color: #64748b;
  background: #f1f5f9; border: 1.5px solid transparent; border-radius: 20px;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.filter-tag:hover { background: #e2e8f0; border-color: #cbd5e1; }
.filter-tag.active {
  background: #eef2ff; color: #6366f1; border-color: #c7d2fe;
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
.workflow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

/* Card */
.wf-card {
  background: #fff; border-radius: 14px; border: 1.5px solid #e2e8f0;
  overflow: hidden; cursor: pointer;
  transition: all 0.25s ease; position: relative;
}
.wf-card:hover {
  border-color: #c7d2fe; box-shadow: 0 8px 28px rgba(0,0,0,0.1);
  transform: translateY(-3px);
}
.card-accent { height: 4px; }
.card-body { display: flex; gap: 14px; padding: 20px 20px 12px; }
.card-icon { font-size: 36px; line-height: 1; flex-shrink: 0; }
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
.wf-card:hover .card-action-btn { opacity: 1; }
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
.field-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
.field-textarea {
  width: 100%; padding: 9px 12px; font-size: 13px; border: 1.5px solid #e2e8f0;
  border-radius: 8px; outline: none; resize: vertical; box-sizing: border-box;
  font-family: inherit;
}
.field-textarea:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
.dialog-btn {
  padding: 9px 20px; font-size: 13px; font-weight: 600; border: none; border-radius: 8px;
  cursor: pointer; transition: all 0.15s;
}
.dialog-btn.cancel { background: #f1f5f9; color: #475569; }
.dialog-btn.cancel:hover { background: #e2e8f0; }
.dialog-btn.primary { background: #6366f1; color: #fff; }
.dialog-btn.primary:hover:not(:disabled) { background: #4f46e5; }
.dialog-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
