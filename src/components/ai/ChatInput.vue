<template>
  <div class="chat-input-wrapper">
    <div class="chat-input-container">
      <!-- 提示词标签 -->
      <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-row">
        <button
          v-for="(s, idx) in suggestions"
          :key="idx"
          class="suggestion-tag"
          @click="$emit('send', s)"
        >
          {{ s }}
        </button>
      </div>

      <!-- 输入区 -->
      <div class="input-row">
        <textarea
          ref="textareaRef"
          v-model="inputText"
          class="chat-textarea"
          :placeholder="placeholder"
          :rows="1"
          @input="autoResize"
          @keydown="handleKeydown"
          :disabled="disabled"
        ></textarea>

        <div class="input-actions">
          <!-- 停止生成按钮 -->
          <button
            v-if="isStreaming"
            class="btn-stop"
            @click="$emit('stop')"
            title="停止生成"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="1"/>
            </svg>
          </button>

          <!-- 发送按钮 -->
          <button
            v-else
            class="btn-send"
            :class="{ disabled: !inputText.trim() || disabled }"
            :disabled="!inputText.trim() || disabled"
            @click="sendMessage"
            title="发送消息 (Enter)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 底部提示 -->
      <div class="input-footer">
        <span class="footer-hint">Enter 发送 · Shift+Enter 换行</span>
        <span class="footer-model">{{ modelLabel }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, computed } from 'vue'
import { USE_MOCK, currentModel } from '../../config/aiModels.js'

const props = defineProps({
  isStreaming: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  placeholder: { type: String, default: '输入你的问题...' },
  showSuggestions: { type: Boolean, default: true }
})

const emit = defineEmits(['send', 'stop'])

const inputText = ref('')
const textareaRef = ref(null)

const modelLabel = computed(() => {
  return USE_MOCK ? 'Mock 模式' : (currentModel?.name || 'AI')
})

const suggestions = [
  '解释数据仓库分层架构',
  '用 Python 实现快速排序',
  '推导高斯积分公式',
  '画出敏捷开发流程图',
  '什么是 Kubernetes？'
]

function autoResize() {
  nextTick(() => {
    const el = textareaRef.value
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  })
}

function handleKeydown(e) {
  // Enter 发送，Shift+Enter 换行
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

function sendMessage() {
  const text = inputText.value.trim()
  if (!text || props.disabled) return

  emit('send', text)
  inputText.value = ''

  // 重置 textarea 高度
  nextTick(() => {
    const el = textareaRef.value
    if (el) {
      el.style.height = 'auto'
    }
  })
}

// 暴露 focus 方法
function focus() {
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

defineExpose({ focus })
</script>

<style scoped>
.chat-input-wrapper {
  padding: 16px 20px 20px;
  border-top: 1px solid #e8eaf0;
  background: #ffffff;
}

.chat-input-container {
  max-width: 800px;
  margin: 0 auto;
}

/* 建议标签 */
.suggestions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  justify-content: center;
}

.suggestion-tag {
  padding: 5px 14px;
  font-size: 12px;
  color: #64748b;
  background: #f1f3f6;
  border: 1px solid #e8eaf0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.suggestion-tag:hover {
  color: #4f46e5;
  background: #eef2ff;
  border-color: #c7d2fe;
}

/* 输入行 */
.input-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  background: #f8f9fb;
  border: 1px solid #e8eaf0;
  border-radius: 12px;
  padding: 10px 14px;
  transition: border-color 0.2s;
}

.input-row:focus-within {
  border-color: #6366f1;
  background: #ffffff;
}

.chat-textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #1e293b;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  max-height: 200px;
  font-family: inherit;
}

.chat-textarea::placeholder {
  color: #94a3b8;
}

.chat-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 按钮 */
.input-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.btn-send,
.btn-stop {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-send {
  background: #6366f1;
  color: #fff;
}

.btn-send:hover:not(.disabled) {
  background: #4f46e5;
  transform: scale(1.05);
}

.btn-send.disabled {
  background: #e2e5ea;
  color: #94a3b8;
  cursor: not-allowed;
}

.btn-stop {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.btn-stop:hover {
  background: rgba(239, 68, 68, 0.25);
}

/* 底部提示 */
.input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding: 0 4px;
}

.footer-hint {
  font-size: 11px;
  color: #94a3b8;
}

.footer-model {
  font-size: 11px;
  color: #6366f1;
}
</style>
