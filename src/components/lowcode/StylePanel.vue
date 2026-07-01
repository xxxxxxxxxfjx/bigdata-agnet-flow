<script setup>
import { ref, watch } from 'vue'
import { useCanvas } from '../../composables/useCanvas.js'
import { useDataBinding } from '../../composables/useDataBinding.js'

const canvas = useCanvas()
const {
  selectedComponent,
  selectedComponentTypeConfig,
  components,
  updateComponentConfig,
  updateComponentStyle,
  updateComponentDataSource,
  updateComponentMockData,
  updatePosition,
  updateSize,
  removeComponent,
  selectComponent,
  bringToFront,
  sendToBack,
  moveUp,
  moveDown,
} = canvas

const { data: boundData, loading: dataLoading, refresh: refreshData, lastRefreshTime } = useDataBinding(selectedComponent)

const activeTab = ref('config')
const localX = ref(0)
const localY = ref(0)
const localW = ref(0)
const localH = ref(0)

const dataSourceTypes = [
  { key: 'mock', label: '示例数据', desc: '使用组件内置演示数据' },
  { key: 'static', label: '静态数据', desc: '直接读取组件字段配置' },
  { key: 'dataset', label: '数据集', desc: '绑定查询或数据集字段' },
  { key: 'api', label: 'HTTP API', desc: '请求远程接口' },
]

watch(
  () => selectedComponent.value,
  (comp) => {
    if (!comp) return
    localX.value = comp.x
    localY.value = comp.y
    localW.value = comp.w
    localH.value = comp.h
  },
  { immediate: true }
)

function isColorField(field) {
  const key = String(field.key || '').toLowerCase()
  return key.includes('color') || (field.placeholder || '').startsWith('#')
}

function getFieldValue(key) {
  return selectedComponent.value?.data?.config?.[key] ?? ''
}

function getStyleValue(key) {
  return selectedComponent.value?.data?.style?.[key] ?? ''
}

function onConfigChange(key, value) {
  if (selectedComponent.value) updateComponentConfig(selectedComponent.value.id, key, value)
}

function onStyleChange(key, value) {
  if (selectedComponent.value) updateComponentStyle(selectedComponent.value.id, key, value)
}

function onPositionChange() {
  if (!selectedComponent.value) return
  updatePosition(selectedComponent.value.id, Number(localX.value), Number(localY.value))
}

function onSizeChange() {
  if (!selectedComponent.value) return
  updateSize(selectedComponent.value.id, Number(localW.value), Number(localH.value))
}

function getDataSourceValue(key) {
  return selectedComponent.value?.data?.config?.dataSource?.[key] ?? ''
}

function onDataSourceChange(key, value) {
  if (selectedComponent.value) updateComponentDataSource(selectedComponent.value.id, { [key]: value })
}

function onDataTypeChange(type) {
  if (!selectedComponent.value) return
  updateComponentDataSource(selectedComponent.value.id, { type })
  if (type === 'mock' && selectedComponentTypeConfig.value?.mockData) {
    updateComponentMockData(selectedComponent.value.id, selectedComponentTypeConfig.value.mockData())
  }
}

function handleDelete() {
  if (selectedComponent.value) removeComponent(selectedComponent.value.id)
}

function getDataPreview() {
  if (boundData.value) return JSON.stringify(boundData.value, null, 2)
  const comp = selectedComponent.value
  if (!comp?.data?.config) return '{}'
  const { dataSource, theme, colors, ...fields } = comp.data.config
  return JSON.stringify(fields, null, 2)
}
</script>

<template>
  <aside class="style-panel" :class="{ empty: !selectedComponent }">
    <template v-if="selectedComponent">
      <header class="panel-header" :style="{ '--accent': selectedComponent.data?.color || '#2563eb' }">
        <div class="component-title">
          <span class="component-icon">{{ selectedComponent.data?.icon }}</span>
          <span>
            <strong>{{ selectedComponent.data?.label }}</strong>
            <small>{{ selectedComponent.type }} · {{ selectedComponent.id }}</small>
          </span>
        </div>
        <button class="delete-btn" title="删除组件" @click="handleDelete">×</button>
      </header>

      <nav class="panel-tabs">
        <button v-for="tab in [
          { key: 'config', label: '配置' },
          { key: 'style', label: '样式' },
          { key: 'data', label: '数据' },
          { key: 'layer', label: '图层' },
        ]" :key="tab.key" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
          {{ tab.label }}
        </button>
      </nav>

      <div class="panel-body">
        <section v-if="activeTab === 'config'" class="tab-content">
          <div class="config-section" v-if="selectedComponentTypeConfig?.configFields">
            <h3>组件配置</h3>
            <div v-for="field in selectedComponentTypeConfig.configFields" :key="field.key" class="field">
              <label>{{ field.label }}</label>

              <div v-if="isColorField(field)" class="color-field">
                <input type="color" :value="getFieldValue(field.key) || '#2563eb'" @input="onConfigChange(field.key, $event.target.value)" />
                <input type="text" :placeholder="field.placeholder" :value="getFieldValue(field.key)" @input="onConfigChange(field.key, $event.target.value)" />
              </div>

              <input v-else-if="field.type === 'text'" type="text" :placeholder="field.placeholder" :value="getFieldValue(field.key)" @input="onConfigChange(field.key, $event.target.value)" />
              <input v-else-if="field.type === 'number'" type="number" :value="getFieldValue(field.key)" @input="onConfigChange(field.key, Number($event.target.value))" />
              <select v-else-if="field.type === 'select'" :value="getFieldValue(field.key)" @change="onConfigChange(field.key, $event.target.value)">
                <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <textarea v-else-if="field.type === 'textarea'" rows="3" :placeholder="field.placeholder" :value="getFieldValue(field.key)" @input="onConfigChange(field.key, $event.target.value)" />
              <textarea v-else-if="field.type === 'code'" class="code-input" rows="5" :placeholder="field.placeholder" :value="getFieldValue(field.key)" @input="onConfigChange(field.key, $event.target.value)" />
              <div v-else-if="field.type === 'slider'" class="slider-group">
                <input type="range" :min="field.min" :max="field.max" :step="field.step" :value="getFieldValue(field.key)" @input="onConfigChange(field.key, Number($event.target.value))" />
                <span>{{ getFieldValue(field.key) }}</span>
              </div>
              <label v-else-if="field.type === 'switch'" class="switch-wrapper">
                <input type="checkbox" :checked="getFieldValue(field.key)" @change="onConfigChange(field.key, $event.target.checked)" />
                <span></span>
                <em>{{ getFieldValue(field.key) ? '开启' : '关闭' }}</em>
              </label>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'style'" class="tab-content">
          <div class="config-section">
            <h3>位置尺寸</h3>
            <div class="field-row">
              <div class="field half"><label>X</label><input v-model.number="localX" type="number" @change="onPositionChange" /></div>
              <div class="field half"><label>Y</label><input v-model.number="localY" type="number" @change="onPositionChange" /></div>
            </div>
            <div class="field-row">
              <div class="field half"><label>宽</label><input v-model.number="localW" type="number" @change="onSizeChange" /></div>
              <div class="field half"><label>高</label><input v-model.number="localH" type="number" @change="onSizeChange" /></div>
            </div>
          </div>

          <div class="config-section">
            <h3>外观</h3>
            <div class="field">
              <label>透明度</label>
              <div class="slider-group">
                <input type="range" min="0" max="1" step="0.05" :value="typeof getStyleValue('opacity') === 'number' ? getStyleValue('opacity') : 1" @input="onStyleChange('opacity', Number($event.target.value))" />
                <span>{{ typeof getStyleValue('opacity') === 'number' ? getStyleValue('opacity') : 1 }}</span>
              </div>
            </div>
            <div class="field"><label>圆角(px)</label><input type="number" :value="getStyleValue('borderRadius') || 0" @input="onStyleChange('borderRadius', Number($event.target.value))" /></div>
            <div class="field"><label>背景</label><input :value="getStyleValue('background') || 'transparent'" placeholder="transparent / rgba(...)" @input="onStyleChange('background', $event.target.value)" /></div>
            <div class="field"><label>边框</label><input :value="getStyleValue('border') || 'none'" placeholder="CSS border" @input="onStyleChange('border', $event.target.value)" /></div>
            <div class="field"><label>阴影</label><input :value="getStyleValue('boxShadow') || 'none'" placeholder="CSS box-shadow" @input="onStyleChange('boxShadow', $event.target.value)" /></div>
          </div>
        </section>

        <section v-if="activeTab === 'data'" class="tab-content">
          <div class="config-section">
            <h3>数据源</h3>
            <div class="ds-type-group">
              <button
                v-for="opt in dataSourceTypes"
                :key="opt.key"
                :class="{ active: (selectedComponent?.data?.config?.dataSource?.type || 'mock') === opt.key }"
                @click="onDataTypeChange(opt.key)"
              >
                <strong>{{ opt.label }}</strong>
                <small>{{ opt.desc }}</small>
              </button>
            </div>

            <template v-if="(selectedComponent?.data?.config?.dataSource?.type || 'mock') === 'dataset'">
              <div class="field"><label>数据集 ID</label><input :value="getDataSourceValue('datasetId')" placeholder="例如 ds_sales_live" @input="onDataSourceChange('datasetId', $event.target.value)" /></div>
              <div class="field"><label>查询名称</label><input :value="getDataSourceValue('queryName')" placeholder="看板查询名称" @input="onDataSourceChange('queryName', $event.target.value)" /></div>
              <div class="field"><label>SQL</label><textarea class="code-input" rows="5" :value="getDataSourceValue('sql')" @input="onDataSourceChange('sql', $event.target.value)" /></div>
              <div class="field"><label>字段映射(JSON)</label><textarea class="code-input" rows="4" :value="getDataSourceValue('fieldMapping')" placeholder='{"xField":"region","yField":"revenue"}' @input="onDataSourceChange('fieldMapping', $event.target.value)" /></div>
            </template>

            <template v-if="(selectedComponent?.data?.config?.dataSource?.type || 'mock') === 'api'">
              <div class="field"><label>请求地址</label><input :value="getDataSourceValue('apiUrl')" placeholder="https://api.example.com/data" @input="onDataSourceChange('apiUrl', $event.target.value)" /></div>
              <div class="field">
                <label>请求方法</label>
                <select :value="getDataSourceValue('apiMethod') || 'GET'" @change="onDataSourceChange('apiMethod', $event.target.value)">
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>
              <div class="field"><label>请求头(JSON)</label><input :value="getDataSourceValue('apiHeaders')" placeholder='{"Authorization":"Bearer xxx"}' @input="onDataSourceChange('apiHeaders', $event.target.value)" /></div>
              <div class="field"><label>响应路径</label><input :value="getDataSourceValue('apiDataPath')" placeholder="例如 data.list" @input="onDataSourceChange('apiDataPath', $event.target.value)" /></div>
            </template>

            <div class="field"><label>刷新间隔(秒，0 表示关闭)</label><input type="number" min="0" step="5" :value="getDataSourceValue('refreshInterval') || 0" @input="onDataSourceChange('refreshInterval', Number($event.target.value))" /></div>
          </div>

          <div class="config-section">
            <h3>数据操作</h3>
            <button class="primary-wide" :disabled="dataLoading" @click="refreshData">
              {{ dataLoading ? '加载中...' : '手动刷新' }}
            </button>
            <p v-if="lastRefreshTime" class="hint">上次刷新：{{ new Date(lastRefreshTime).toLocaleTimeString() }}</p>
          </div>

          <div class="config-section">
            <h3>数据预览</h3>
            <pre class="data-preview">{{ getDataPreview() }}</pre>
          </div>
        </section>

        <section v-if="activeTab === 'layer'" class="tab-content">
          <div class="config-section">
            <h3>图层列表</h3>
            <div class="layer-list">
              <button
                v-for="comp in [...components].sort((a,b) => (b.zIndex || 0) - (a.zIndex || 0))"
                :key="comp.id"
                class="layer-item"
                :class="{ active: comp.id === selectedComponent?.id }"
                @click="selectComponent(comp.id)"
              >
                <span>{{ comp.data?.icon || '#' }}</span>
                <strong>{{ comp.data?.label || comp.type }}</strong>
                <em>{{ comp.zIndex || 1 }}</em>
              </button>
            </div>
          </div>
          <div class="config-section">
            <h3>图层操作</h3>
            <div class="layer-actions">
              <button @click="bringToFront(selectedComponent.id)">置顶</button>
              <button @click="moveUp(selectedComponent.id)">上移</button>
              <button @click="moveDown(selectedComponent.id)">下移</button>
              <button @click="sendToBack(selectedComponent.id)">置底</button>
            </div>
          </div>
        </section>
      </div>
    </template>

    <div v-else class="empty-state">
      <strong>未选择组件</strong>
      <span>选择画布中的组件后，可编辑配置、样式、数据和图层。</span>
    </div>
  </aside>
</template>

<style scoped>
.style-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border-left: 1px solid #dbe3ef;
}

.style-panel.empty {
  justify-content: center;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  border-bottom: 1px solid #e5edf7;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, white), #ffffff);
}

.component-title {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.component-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 6px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, white);
  font-weight: 900;
}

.component-title span:last-child {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.component-title strong {
  color: #0f172a;
  font-size: 13px;
}

.component-title small {
  overflow: hidden;
  color: #64748b;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  width: 30px;
  height: 30px;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #b91c1c;
  background: #fff7f7;
  cursor: pointer;
  font-size: 18px;
}

.panel-tabs {
  display: flex;
  border-bottom: 1px solid #e5edf7;
}

.panel-tabs button {
  flex: 1;
  height: 38px;
  border: 0;
  border-bottom: 2px solid transparent;
  color: #64748b;
  background: #ffffff;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.panel-tabs button.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 14px 18px;
}

.config-section {
  margin-top: 16px;
}

.config-section h3 {
  margin: 0 0 10px;
  padding-bottom: 7px;
  border-bottom: 1px solid #eef2f7;
  color: #64748b;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.3px;
}

.field {
  margin-bottom: 12px;
}

.field label {
  display: block;
  margin-bottom: 5px;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
}

input,
select,
textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #dbe3ef;
  border-radius: 6px;
  color: #0f172a;
  background: #ffffff;
  outline: none;
  font-size: 12px;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

textarea {
  min-height: 72px;
  resize: vertical;
  line-height: 1.5;
}

.code-input,
.data-preview {
  font-family: Consolas, Monaco, monospace;
}

.code-input,
.data-preview {
  color: #dbeafe;
  background: #0f172a;
}

.data-preview {
  max-height: 220px;
  margin: 0;
  padding: 10px;
  overflow: auto;
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 11px;
}

.field-row,
.color-field {
  display: flex;
  gap: 8px;
}

.field.half {
  flex: 1;
}

.color-field input[type='color'] {
  width: 38px;
  height: 34px;
  padding: 2px;
  flex-shrink: 0;
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider-group input {
  padding: 0;
  accent-color: #2563eb;
}

.slider-group span {
  min-width: 34px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 900;
  text-align: right;
}

.switch-wrapper {
  display: flex !important;
  align-items: center;
  gap: 9px;
  cursor: pointer;
}

.switch-wrapper input {
  display: none;
}

.switch-wrapper span {
  width: 38px;
  height: 20px;
  position: relative;
  border-radius: 999px;
  background: #cbd5e1;
}

.switch-wrapper span::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  transition: transform 0.18s ease;
}

.switch-wrapper input:checked + span {
  background: #2563eb;
}

.switch-wrapper input:checked + span::after {
  transform: translateX(18px);
}

.switch-wrapper em {
  color: #64748b;
  font-size: 11px;
  font-style: normal;
}

.ds-type-group {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.ds-type-group button,
.layer-item,
.layer-actions button,
.primary-wide {
  border: 1px solid #dbe3ef;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
}

.ds-type-group button {
  min-height: 64px;
  padding: 9px;
  text-align: left;
}

.ds-type-group button.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.ds-type-group strong {
  display: block;
  color: #0f172a;
  font-size: 12px;
}

.ds-type-group small {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 10px;
  line-height: 1.4;
}

.primary-wide {
  width: 100%;
  height: 34px;
  color: #ffffff;
  background: #2563eb;
  border-color: #2563eb;
  font-weight: 800;
}

.primary-wide:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hint {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 11px;
  text-align: center;
}

.layer-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.layer-item {
  min-height: 34px;
  display: grid;
  grid-template-columns: 24px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
}

.layer-item.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.layer-item strong {
  overflow: hidden;
  color: #0f172a;
  font-size: 12px;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-item em {
  color: #64748b;
  font-size: 11px;
  font-style: normal;
}

.layer-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.layer-actions button {
  height: 32px;
  color: #334155;
  font-weight: 800;
}

.empty-state {
  width: 100%;
  padding: 26px;
  text-align: center;
}

.empty-state strong {
  display: block;
  color: #0f172a;
  font-size: 15px;
}

.empty-state span {
  display: block;
  margin-top: 8px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}
</style>
