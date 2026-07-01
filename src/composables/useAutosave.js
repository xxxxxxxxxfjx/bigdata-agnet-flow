import { ref, watch } from 'vue'

const STORAGE_PREFIX = 'bigdata_agent_flow_'
const PROJECTS_KEY = STORAGE_PREFIX + 'projects'
const CURRENT_PROJECT_KEY = STORAGE_PREFIX + 'current_project'

/**
 * localStorage 自动保存 + 项目管理系统
 *
 * 功能：
 * - 自动保存当前画布到 localStorage
 * - 多项目管理（新建、切换、删除）
 * - 离开页面时自动保存
 * - 下次打开时恢复上次编辑的项目
 */

export function useAutosave(canvasData, canvasStyle, debounceMs = 800) {
  const projects = ref(loadProjects())
  const currentProjectId = ref(localStorage.getItem(CURRENT_PROJECT_KEY) || null)
  const lastSaveTime = ref(null)
  const isDirty = ref(false)

  let saveTimer = null

  function loadProjects() {
    try {
      return JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]')
    } catch { return [] }
  }

  function saveProjects() {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects.value))
  }

  function getProject(id) {
    try {
      const key = STORAGE_PREFIX + 'project_' + id
      return JSON.parse(localStorage.getItem(key))
    } catch { return null }
  }

  function saveProject(id, data) {
    const key = STORAGE_PREFIX + 'project_' + id
    localStorage.setItem(key, JSON.stringify(data))
    lastSaveTime.value = new Date().toISOString()
    isDirty.value = false

    // Update project list
    const idx = projects.value.findIndex((p) => p.id === id)
    if (idx >= 0) {
      projects.value[idx] = {
        ...projects.value[idx],
        updatedAt: new Date().toISOString(),
        componentCount: data.components?.length || 0,
      }
    }
    saveProjects()
  }

  function createProject(name = '未命名大屏', type = 'bigscreen') {
    const id = 'proj_' + Date.now()
    const now = new Date().toISOString()
    const project = {
      id,
      name,
      type,
      createdAt: now,
      updatedAt: now,
      componentCount: 0,
    }
    projects.value.unshift(project)
    saveProjects()

    // Initialize empty canvas data
    saveProject(id, {
      components: [],
      canvasStyle: { width: 1920, height: 1080, background: '#0f172a', scaleMode: 'full', gridSize: 10, showGrid: true },
    })

    switchProject(id)
    return project
  }

  function deleteProject(id) {
    const key = STORAGE_PREFIX + 'project_' + id
    localStorage.removeItem(key)
    projects.value = projects.value.filter((p) => p.id !== id)
    saveProjects()
    if (currentProjectId.value === id) {
      currentProjectId.value = null
      localStorage.removeItem(CURRENT_PROJECT_KEY)
    }
  }

  function switchProject(id) {
    currentProjectId.value = id
    localStorage.setItem(CURRENT_PROJECT_KEY, id)

    const data = getProject(id)
    if (data) {
      // Restore components
      if (canvasData && data.components) {
        canvasData.value = data.components
      }
      // Restore canvas style
      if (canvasStyle && data.canvasStyle) {
        canvasStyle.value = { ...canvasStyle.value, ...data.canvasStyle }
      }
    }
  }

  function renameProject(id, newName) {
    const project = projects.value.find((p) => p.id === id)
    if (project) {
      project.name = newName
      saveProjects()
    }
  }

  // Auto-save watcher
  function startAutosave() {
    watch(
      () => [canvasData?.value, canvasStyle?.value],
      () => {
        isDirty.value = true
        if (saveTimer) clearTimeout(saveTimer)
        saveTimer = setTimeout(() => {
          if (currentProjectId.value) {
            saveProject(currentProjectId.value, {
              components: canvasData?.value || [],
              canvasStyle: canvasStyle?.value || {},
            })
          }
        }, debounceMs)
      },
      { deep: true }
    )
  }

  // Save on page leave
  function setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      if (currentProjectId.value && isDirty.value) {
        saveProject(currentProjectId.value, {
          components: canvasData?.value || [],
          canvasStyle: canvasStyle?.value || {},
        })
      }
    })
  }

  return {
    projects,
    currentProjectId,
    lastSaveTime,
    isDirty,
    createProject,
    deleteProject,
    switchProject,
    renameProject,
    getProject,
    saveProject: (id, data) => saveProject(id, data),
    startAutosave,
    setupBeforeUnload,
  }
}
