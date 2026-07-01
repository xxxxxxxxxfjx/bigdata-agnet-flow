<script setup>
import { ref, watch } from 'vue'
import { useCanvas } from '../../composables/useCanvas.js'
import { useDataBinding } from '../../composables/useDataBinding.js'

const {
  selectedComponent,
  selectedComponentTypeConfig,
  updateComponentConfig,
  updateComponentStyle,
  updatePosition,
  updateSize,
  removeComponent,
  updateComponentDataSource,
  updateComponentMockData,
  bringToFront,
  sendToBack,
  moveUp,
  moveDown,
} = useCanvas()

// Data binding for selected component
const { data: boundData, loading: dataLoading, refresh: refreshData, lastRefreshTime } =
  useDataBinding(selectedComponent)

const activeTab = ref('config')

// Local bindings for position/size
const localX = ref(0)
const localY = ref(0)
const localW = ref(0)
const localH = ref(0)

watch(
  () => selectedComponent.value,
  (comp) => {
    if (comp) {
      localX.value = comp.x
      localY.value = comp.y
      localW.value = comp.w
      localH.value = comp.h
    }
  },
  { immediate: true }
)

function isColorField(field) {
  const key = (field.key || '').toLowerCase()
  return key.includes('color') || key.includes('colour') ||
    (field.placeholder && field.placeholder.startsWith('#'))
}

function getFieldValue(key) {
  return selectedComponent.value?.data?.config?.[key] ?? ''
}

function getStyleValue(key) {
  return selectedComponent.value?.data?.style?.[key] ?? ''
}

function onConfigChange(key, value) {
  if (selectedComponent.value) {
    updateComponentConfig(selectedComponent.value.id, key, value)
  }
}

function onStyleChange(key, value) {
  if (selectedComponent.value) {
    updateComponentStyle(selectedComponent.value.id, key, value)
  }
}

function onPositionChange() {
  if (selectedComponent.value) {
    updatePosition(selectedComponent.value.id, Number(localX.value), Number(localY.value))
  }
}

function onSizeChange() {
  if (selectedComponent.value) {
    updateSize(selectedComponent.value.id, Number(localW.value), Number(localH.value))
  }
}

function getDataSourceValue(key) {
  return selectedComponent.value?.data?.config?.dataSource?.[key] ?? ''
}

function onDataSourceChange(key, value) {
  if (selectedComponent.value) {
    updateComponentDataSource(selectedComponent.value.id, { [key]: value })
    // If changing refresh interval, the useDataBinding polling will auto-handle it
  }
}

function onDataTypeChange(type) {
  if (selectedComponent.value) {
    updateComponentDataSource(selectedComponent.value.id, { type })
    // Reload mock data when switching to mock
    if (type === 'mock' && selectedComponentTypeConfig.value?.mockData) {
      const mock = selectedComponentTypeConfig.value.mockData()
      updateComponentMockData(selectedComponent.value.id, mock)
    }
  }
}

function handleRefresh() {
  refreshData()
}

function handleDelete() {
  if (selectedComponent.value) {
    removeComponent(selectedComponent.value.id)
  }
}

// Data preview for the data tab
function getDataPreview() {
  if (boundData.value) {
    return JSON.stringify(boundData.value, null, 2)
  }
  const comp = selectedComponent.value
  if (!comp?.data?.config) return '{}'
  const { dataSource, theme, colors, ...fields } = comp.data.config
  return JSON.stringify(fields, null, 2)
}
</script>

<template>
  <aside class="style-panel" :class="{ collapsed: !selectedComponent }">
    <template v-if="selectedComponent">
      <!-- Header -->
      <div class="panel-header" :style="{ '--accent': selectedComponent.data?.color }">
        <div class="header-top">
          <span class="header-icon">{{ selectedComponent.data?.icon }}</span>
          <div class="header-info">
            <span class="header-type">{{ selectedComponent.data?.label }} - {{ selectedComponent.id }}</span>
          </div>
        </div>
        <button class="delete-btn" @click="handleDelete" title="删除">🗑️</button>
      </div>

      <!-- Tabs -->
      <div class="panel-tabs">
        <button
          v-for="tab in [
            { key: 'config', label: '配置' },
            { key: 'style', label: '样式' },
            { key: 'data', label: '数据' },
            { key: 'layer', label: '图层' },
          ]"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Body -->
      <div class="panel-body">
        <!-- ====== 配置 Tab ====== -->
        <div v-if="activeTab === 'config'" class="tab-content">
          <div class="config-section" v-if="selectedComponentTypeConfig?.configFields">
            <h3 class="section-title">组件配置</h3>
            <div
              v-for="field in selectedComponentTypeConfig.configFields"
              :key="field.key"
              class="field"
            >
              <label class="field-label">{{ field.label }}</label>

              <!-- Color fields: show color wheel + text -->
              <div v-if="isColorField(field)" class="color-field">
                <input
                  type="color"
                  class="color-picker"
                  :value="getFieldValue(field.key) || '#6366f1'"
                  @input="onConfigChange(field.key, $event.target.value)"
                />
                <input
                  type="text"
                  class="field-input"
                  :placeholder="field.placeholder"
                  :value="getFieldValue(field.key)"
                  @input="onConfigChange(field.key, $event.target.value)"
                />
              </div>

              <!-- text -->
              <input
                v-else-if="field.type === 'text'"
                type="text"
                class="field-input"
                :placeholder="field.placeholder"
                :value="getFieldValue(field.key)"
                @input="onConfigChange(field.key, $event.target.value)"
              />

              <!-- number -->
              <input
                v-else-if="field.type === 'number'"
                type="number"
                class="field-input"
                :value="getFieldValue(field.key)"
                @input="onConfigChange(field.key, Number($event.target.value))"
              />

              <!-- select -->
              <select
                v-else-if="field.type === 'select'"
                class="field-input"
                :value="getFieldValue(field.key)"
                @change="onConfigChange(field.key, $event.target.value)"
              >
                <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
              </select>

              <!-- textarea -->
              <textarea
                v-else-if="field.type === 'textarea'"
                class="field-textarea"
                :placeholder="field.placeholder"
                :value="getFieldValue(field.key)"
                @input="onConfigChange(field.key, $event.target.value)"
                rows="3"
              />

              <!-- code -->
              <textarea
                v-else-if="field.type === 'code'"
                class="field-code"
                :placeholder="field.placeholder"
                :value="getFieldValue(field.key)"
                @input="onConfigChange(field.key, $event.target.value)"
                rows="5"
                spellcheck="false"
              />

              <!-- slider -->
              <div v-else-if="field.type === 'slider'" class="slider-group">
                <input
                  type="range"
                  class="field-slider"
                  :min="field.min"
                  :max="field.max"
                  :step="field.step"
                  :value="getFieldValue(field.key)"
                  @input="onConfigChange(field.key, Number($event.target.value))"
                />
                <span class="slider-value">{{ getFieldValue(field.key) }}</span>
              </div>

              <!-- switch -->
              <label v-else-if="field.type === 'switch'" class="switch-wrapper">
                <input
                  type="checkbox"
                  class="switch-input"
                  :checked="getFieldValue(field.key)"
                  @change="onConfigChange(field.key, $event.target.checked)"
                />
                <span class="switch-slider"></span>
                <span class="switch-label">{{ getFieldValue(field.key) ? '开启' : '关闭' }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- ====== 样式 Tab ====== -->
        <div v-if="activeTab === 'style'" class="tab-content">
          <!-- Position -->
          <div class="config-section">
            <h3 class="section-title">位置尺寸</h3>
            <div class="field-row">
              <div class="field field-half">
                <label class="field-label">X</label>
                <input
                  type="number"
                  class="field-input"
                  v-model.number="localX"
                  @change="onPositionChange"
                />
              </div>
              <div class="field field-half">
                <label class="field-label">Y</label>
                <input
                  type="number"
                  class="field-input"
                  v-model.number="localY"
                  @change="onPositionChange"
                />
              </div>
            </div>
            <div class="field-row">
              <div class="field field-half">
                <label class="field-label">宽</label>
                <input
                  type="number"
                  class="field-input"
                  v-model.number="localW"
                  @change="onSizeChange"
                />
              </div>
              <div class="field field-half">
                <label class="field-label">高</label>
                <input
                  type="number"
                  class="field-input"
                  v-model.number="localH"
                  @change="onSizeChange"
                />
              </div>
            </div>
          </div>

          <!-- Appearance -->
          <div class="config-section">
            <h3 class="section-title">外观</h3>
            <div class="field">
              <label class="field-label">透明度</label>
              <div class="slider-group">
                <input
                  type="range"
                  class="field-slider"
                  min="0"
                  max="1"
                  step="0.05"
                  :value="typeof getStyleValue('opacity') === 'number' ? getStyleValue('opacity') : 1"
                  @input="onStyleChange('opacity', Number($event.target.value))"
                />
                <span class="slider-value">{{ typeof getStyleValue('opacity') === 'number' ? getStyleValue('opacity') : 1 }}</span>
              </div>
            </div>
            <div class="field">
              <label class="field-label">圆角(px)</label>
              <input
                type="number"
                class="field-input"
                :value="getStyleValue('borderRadius') || 0"
                @input="onStyleChange('borderRadius', Number($event.target.value))"
              />
            </div>
            <div class="field">
              <label class="field-label">背景色</label>
              <input
                type="text"
                class="field-input"
                :value="getStyleValue('background') || 'transparent'"
                @input="onStyleChange('background', $event.target.value)"
                placeholder="transparent / rgba(...)"
              />
            </div>
            <div class="field">
              <label class="field-label">阴影</label>
              <input
                type="text"
                class="field-input"
                :value="getStyleValue('boxShadow') || 'none'"
                @input="onStyleChange('boxShadow', $event.target.value)"
                placeholder="CSS box-shadow"
              />
            </div>
            <div class="field">
              <label class="field-label">边框</label>
              <input
                type="text"
                class="field-input"
                :value="getStyleValue('border') || 'none'"
                @input="onStyleChange('border', $event.target.value)"
                placeholder="CSS border"
              />
            </div>
          </div>
        </div>

        <!-- ====== 数据 Tab ====== -->
        <div v-if="activeTab === 'data'" class="tab-content">
          <!-- Data source type -->
          <div class="config-section">
            <h3 class="section-title">数据源</h3>
            <div class="field">
              <label class="field-label">数据来源</label>
              <div class="ds-type-group">
                <button
                  v-for="opt in [
                    { key: 'mock', label: '📋 模拟', desc: '内置演示数据' },
                    { key: 'static', label: '📝 静态', desc: '手动填写数据' },
                    { key: 'api', label: '🔗 API', desc: '远程接口获取' },
                  ]"
                  :key="opt.key"
                  class="ds-type-btn"
                  :class="{ active: (selectedComponent?.data?.config?.dataSource?.type || 'mock') === opt.key }"
                  @click="onDataTypeChange(opt.key)"
                >
                  <span class="ds-type-label">{{ opt.label }}</span>
                  <span class="ds-type-desc">{{ opt.desc }}</span>
                </button>
              </div>
            </div>

            <!-- API config (only shown when api is selected) -->
            <template v-if="(selectedComponent?.data?.config?.dataSource?.type || 'mock') === 'api'">
              <div class="field">
                <label class="field-label">请求地址</label>
                <input
                  type="text"
                  class="field-input"
                  :value="getDataSourceValue('apiUrl')"
                  @input="onDataSourceChange('apiUrl', $event.target.value)"
                  placeholder="https://api.example.com/data"
                />
              </div>
              <div class="field">
                <label class="field-label">请求方法</label>
                <select
                  class="field-input"
                  :value="getDataSourceValue('apiMethod') || 'GET'"
                  @change="onDataSourceChange('apiMethod', $event.target.value)"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>
              <div class="field">
                <label class="field-label">请求头 (JSON)</label>
                <input
                  type="text"
                  class="field-input"
                  :value="getDataSourceValue('apiHeaders')"
                  @input="onDataSourceChange('apiHeaders', $event.target.value)"
                  placeholder='{"Authorization":"Bearer xxx"}'
                />
              </div>
              <div class="field">
                <label class="field-label">数据路径</label>
                <input
                  type="text"
                  class="field-input"
                  :value="getDataSourceValue('apiDataPath')"
                  @input="onDataSourceChange('apiDataPath', $event.target.value)"
                  placeholder="如 data.list（点号分隔）"
                />
              </div>
            </template>

            <!-- Refresh interval -->
            <div class="field">
              <label class="field-label">刷新间隔 (秒，0=不自动刷新)</label>
              <input
                type="number"
                class="field-input"
                :value="getDataSourceValue('refreshInterval') || 0"
                @input="onDataSourceChange('refreshInterval', Number($event.target.value))"
                min="0"
                step="5"
              />
            </div>
          </div>

          <!-- Operations -->
          <div class="config-section">
            <h3 class="section-title">数据操作</h3>
            <div class="data-ops">
              <button class="data-op-btn primary" @click="handleRefresh" :disabled="dataLoading">
                {{ dataLoading ? '⏳ 加载中...' : '🔄 手动刷新' }}
              </button>
              <span v-if="lastRefreshTime" class="last-refresh">
                上次刷新: {{ new Date(lastRefreshTime).toLocaleTimeString() }}
              </span>
            </div>
          </div>

          <!-- Data preview -->
          <div class="config-section">
            <h3 class="section-title">数据预览</h3>
            <div class="data-preview">
              <pre>{{ getDataPreview() }}</pre>
            </div>
          </div>

          <!-- Mock data editor (only shown when mock is selected) -->
          <div
            v-if="(selectedComponent?.data?.config?.dataSource?.type || 'mock') === 'mock'"
            class="config-section"
          >
            <h3 class="section-title">Mock 数据编辑</h3>
            <p class="section-hint">修改后点击刷新即可看到效果</p>
            <div
              v-for="field in selectedComponentTypeConfig?.configFields?.filter(f => !['title','theme','colors'].includes(f.key)) || []"
              :key="'mock-' + field.key"
              class="field"
            >
              <label class="field-label">{{ field.label }}</label>
              <input
                v-if="field.type === 'text' || field.type === 'number'"
                :type="field.type"
                class="field-input"
                :placeholder="field.placeholder"
                :value="getFieldValue(field.key)"
                @input="onConfigChange(field.key, field.type === 'number' ? Number($event.target.value) : $event.target.value)"
              />
              <textarea
                v-else-if="field.type === 'textarea'"
                class="field-textarea"
                :placeholder="field.placeholder"
                :value="getFieldValue(field.key)"
                @input="onConfigChange(field.key, $event.target.value)"
                rows="2"
              />
            </div>
          </div>
        </div>

        <!-- ====== 图层 Tab ====== -->
        <div v-if="activeTab === 'layer'" class="tab-content">
          <!-- Layer list -->
          <div class="config-section">
            <h3 class="section-title">图层列表</h3>
            <div class="layer-list">
              <div
                v-for="comp in [...useCanvas().components.value].sort((a,b) => (b.zIndex||0)-(a.zIndex||0))"
                :key="comp.id"
                class="layer-item"
                :class="{ active: comp.id === selectedComponent?.id }"
                @click="useCanvas().selectComponent(comp.id)"
              >
                <span class="layer-icon">{{ comp.data?.icon || '📊' }}</span>
                <span class="layer-name">{{ comp.data?.label || comp.type }}</span>
                <span class="layer-type">{{ comp.type }}</span>
                <span class="layer-vis" @click.stop :title="comp.visible ? '可见' : '隐藏'">
                  {{ comp.visible !== false ? '👁️' : '🚫' }}
                </span>
              </div>
              <div v-if="!useCanvas().components.value.length" class="empty-list">暂无组件</div>
            </div>
          </div>

          <!-- Operations -->
          <div class="config-section">
            <h3 class="section-title">图层操作</h3>
            <div class="layer-buttons">
              <button class="layer-btn" @click="bringToFront(selectedComponent.id)">
                ⬆ 置顶
              </button>
              <button class="layer-btn" @click="moveUp(selectedComponent.id)">
                ↑ 上移
              </button>
              <button class="layer-btn" @click="moveDown(selectedComponent.id)">
                ↓ 下移
              </button>
              <button class="layer-btn" @click="sendToBack(selectedComponent.id)">
                ⬇ 置底
              </button>
            </div>
          </div>
          <div class="config-section">
            <h3 class="section-title">组件信息</h3>
            <div class="field">
              <label class="field-label">ID</label>
              <input type="text" class="field-input readonly" :value="selectedComponent.id" readonly />
            </div>
            <div class="field">
              <label class="field-label">类型</label>
              <input type="text" class="field-input readonly" :value="selectedComponent.type" readonly />
            </div>
            <div class="field">
              <label class="field-label">zIndex</label>
              <input type="text" class="field-input readonly" :value="selectedComponent.zIndex" readonly />
            </div>
          </div>
        </div>
      </div>
    </template>
  </aside>
</template>

<style scoped>
.style-panel {
  width: 300px;
  min-width: 300px;
  background: #ffffff;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  transition: width 0.25s ease, min-width 0.25s ease, opacity 0.25s ease;
}

.style-panel.collapsed {
  width: 0;
  min-width: 0;
  border-left: none;
  opacity: 0;
  pointer-events: none;
}

/* Header */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent, #6366f1) 6%, white), white);
}

.header-top {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.header-icon {
  font-size: 24px;
  line-height: 1;
  flex-shrink: 0;
}

.header-info {
  min-width: 0;
}

.header-type {
  font-size: 11px;
  color: #94a3b8;
  font-family: monospace;
}

.delete-btn {
  background: none;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
  flex-shrink: 0;
}

.delete-btn:hover {
  background: #fef2f2;
  border-color: #f87171;
}

/* Tabs */
.panel-tabs {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
}

.tab-btn {
  flex: 1;
  padding: 10px 8px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-btn:hover {
  color: #64748b;
  background: #f8fafc;
}

.tab-btn.active {
  color: #6366f1;
  border-bottom-color: #6366f1;
}

/* Body */
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 14px 20px;
}

.tab-content {
  padding-top: 4px;
}

/* Sections & Fields (reuse pattern from ConfigPanel) */
.config-section {
  margin-top: 16px;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 10px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid #f1f5f9;
}

.field {
  margin-bottom: 12px;
}

.field-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
}

.field-row {
  display: flex;
  gap: 10px;
}

.field-half {
  flex: 1;
}

.field-input {
  width: 100%;
  padding: 7px 10px;
  font-size: 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 7px;
  background: #fafbfc;
  color: #1e293b;
  transition: all 0.15s;
  outline: none;
  box-sizing: border-box;
}

.field-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  background: #fff;
}

.field-input.readonly {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
  font-family: monospace;
  font-size: 11px;
}

.field-textarea {
  width: 100%;
  padding: 7px 10px;
  font-size: 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 7px;
  background: #fafbfc;
  color: #1e293b;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  line-height: 1.5;
  transition: all 0.15s;
}

.field-textarea:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  background: #fff;
}

.field-code {
  width: 100%;
  padding: 8px 10px;
  font-size: 11px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  border: 1.5px solid #e2e8f0;
  border-radius: 7px;
  background: #1e293b;
  color: #e2e8f0;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  line-height: 1.6;
  tab-size: 2;
}

.field-code:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.field-slider {
  flex: 1;
  accent-color: #6366f1;
  height: 4px;
}

.slider-value {
  font-size: 12px;
  font-weight: 600;
  color: #6366f1;
  min-width: 28px;
  text-align: right;
}

/* Switch */
.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.switch-input {
  display: none;
}

.switch-slider {
  width: 38px;
  height: 20px;
  background: #cbd5e1;
  border-radius: 10px;
  position: relative;
  transition: background 0.2s;
}

.switch-slider::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.switch-input:checked + .switch-slider {
  background: #6366f1;
}

.switch-input:checked + .switch-slider::after {
  transform: translateX(18px);
}

.switch-label {
  font-size: 11px;
  color: #64748b;
}

/* Layer buttons */
.layer-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.layer-btn {
  padding: 8px;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  background: #fafbfc;
  border: 1.5px solid #e2e8f0;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.15s;
}

.layer-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

/* Data source type buttons */
.ds-type-group {
  display: flex;
  gap: 6px;
}

.ds-type-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 6px;
  background: #fafbfc;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.ds-type-btn:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.ds-type-btn.active {
  border-color: #6366f1;
  background: #eef2ff;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.ds-type-label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.ds-type-btn.active .ds-type-label {
  color: #6366f1;
}

.ds-type-desc {
  font-size: 10px;
  color: #94a3b8;
}

/* Data operations */
.data-ops {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-op-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  background: #fafbfc;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.data-op-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.data-op-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.data-op-btn.primary {
  color: #6366f1;
  border-color: #6366f1;
  background: #eef2ff;
}

.data-op-btn.primary:hover:not(:disabled) {
  background: #e0e7ff;
}

.last-refresh {
  font-size: 10px;
  color: #94a3b8;
  text-align: center;
}

/* Data preview */
.data-preview {
  background: #1e293b;
  border-radius: 8px;
  padding: 10px;
  max-height: 200px;
  overflow: auto;
}

.data-preview pre {
  margin: 0;
  font-size: 11px;
  font-family: 'Consolas', 'Monaco', monospace;
  color: #e2e8f0;
  white-space: pre-wrap;
  word-break: break-all;
}

.section-hint {
  font-size: 11px;
  color: #94a3b8;
  margin: -6px 0 8px;
}

/* Color picker */
.color-field {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-picker {
  width: 36px;
  height: 36px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  padding: 2px;
  background: #fff;
  flex-shrink: 0;
}

.color-picker::-webkit-color-swatch-wrapper { padding: 0; }
.color-picker::-webkit-color-swatch { border-radius: 4px; border: none; }

/* Layer tab - component list */
.layer-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 320px;
  overflow-y: auto;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 7px;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 12px;
}

.layer-item:hover { background: #f8fafc; border-color: #e2e8f0; }
.layer-item.active { background: #eef2ff; border-color: #c7d2fe; }

.layer-icon { font-size: 16px; flex-shrink: 0; }
.layer-name { flex: 1; font-weight: 500; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.layer-type { font-size: 10px; color: #94a3b8; }
.layer-vis { font-size: 14px; cursor: pointer; opacity: 0.6; }
.layer-vis:hover { opacity: 1; }
</style>
