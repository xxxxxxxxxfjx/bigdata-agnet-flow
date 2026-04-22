<script setup>
import { computed, ref, watch } from 'vue'
import { useWorkflow } from '../composables/useWorkflow.js'

const {
  selectedNode,
  selectedNodeTypeConfig,
  updateNodeConfig,
  updateNodeLabel,
  removeNode,
} = useWorkflow()

const localLabel = ref('')

watch(
  () => selectedNode.value?.data?.label,
  (val) => {
    localLabel.value = val || ''
  },
  { immediate: true }
)

function onLabelChange() {
  if (selectedNode.value) {
    updateNodeLabel(selectedNode.value.id, localLabel.value)
  }
}

function onConfigChange(key, value) {
  if (selectedNode.value) {
    updateNodeConfig(selectedNode.value.id, key, value)
  }
}

function handleDelete() {
  if (selectedNode.value) {
    removeNode(selectedNode.value.id)
  }
}

function getFieldValue(key) {
  return selectedNode.value?.data?.config?.[key] ?? ''
}
</script>

<template>
  <aside class="config-panel" :class="{ collapsed: !selectedNode }">
    <template v-if="selectedNode">
      <div class="panel-header" :style="{ '--accent': selectedNode.data?.color }">
        <div class="header-top">
          <span class="header-icon">{{ selectedNode.data?.icon }}</span>
          <div class="header-info">
            <span class="header-type">{{ selectedNode.data?.type }}</span>
          </div>
        </div>
        <button class="delete-btn" @click="handleDelete" title="删除节点">
          🗑️
        </button>
      </div>

      <div class="panel-body">
        <!-- 节点名称 -->
        <div class="config-section">
          <h3 class="section-title">基本信息</h3>
          <div class="field">
            <label class="field-label">节点名称</label>
            <input
              type="text"
              class="field-input"
              v-model="localLabel"
              @change="onLabelChange"
            />
          </div>
          <div class="field">
            <label class="field-label">节点ID</label>
            <input
              type="text"
              class="field-input readonly"
              :value="selectedNode.id"
              readonly
            />
          </div>
        </div>

        <!-- 动态配置字段 -->
        <div class="config-section" v-if="selectedNodeTypeConfig?.configFields">
          <h3 class="section-title">节点配置</h3>

          <div
            v-for="field in selectedNodeTypeConfig.configFields"
            :key="field.key"
            class="field"
          >
            <label class="field-label">{{ field.label }}</label>

            <!-- text -->
            <input
              v-if="field.type === 'text'"
              type="text"
              class="field-input"
              :placeholder="field.placeholder"
              :value="getFieldValue(field.key)"
              @input="onConfigChange(field.key, $event.target.value)"
            />

            <!-- password -->
            <input
              v-else-if="field.type === 'password'"
              type="password"
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
              <option v-for="opt in field.options" :key="opt" :value="opt">
                {{ opt }}
              </option>
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

            <!-- tags -->
            <div v-else-if="field.type === 'tags'" class="tags-input">
              <input
                type="text"
                class="field-input"
                :placeholder="field.placeholder"
                :value="Array.isArray(getFieldValue(field.key)) ? getFieldValue(field.key).join(', ') : ''"
                @change="onConfigChange(field.key, $event.target.value.split(',').map(s => s.trim()).filter(Boolean))"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

  </aside>
</template>

<style scoped>
.config-panel {
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

.config-panel.collapsed {
  width: 0;
  min-width: 0;
  border-left: none;
  opacity: 0;
  pointer-events: none;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent, #6366f1) 6%, white), white);
}

.header-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 28px;
  line-height: 1;
}

.header-info {
  display: flex;
  flex-direction: column;
}

.header-type {
  font-size: 12px;
  color: #94a3b8;
  font-family: monospace;
}

.delete-btn {
  background: none;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.15s;
}

.delete-btn:hover {
  background: #fef2f2;
  border-color: #f87171;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 20px;
}

.config-section {
  margin-top: 18px;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid #f1f5f9;
}

.field {
  margin-bottom: 14px;
}

.field-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 5px;
}

.field-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
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
  padding: 8px 12px;
  font-size: 13px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
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
  padding: 10px 12px;
  font-size: 12px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  background: #1e293b;
  color: #e2e8f0;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  line-height: 1.6;
  tab-size: 2;
  transition: all 0.15s;
}

.field-code:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.field-slider {
  flex: 1;
  accent-color: #6366f1;
  height: 4px;
}

.slider-value {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  min-width: 32px;
  text-align: right;
}

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
  width: 40px;
  height: 22px;
  background: #cbd5e1;
  border-radius: 11px;
  position: relative;
  transition: background 0.2s;
}

.switch-slider::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
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
  font-size: 12px;
  color: #64748b;
}

</style>
