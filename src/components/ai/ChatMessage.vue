<template>
  <div :class="['chat-message', role]">
    <!-- 头像区 -->
    <div class="message-avatar">
      <div v-if="role === 'user'" class="avatar user-avatar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <div v-else class="avatar assistant-avatar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2z"/>
          <path d="M7 9.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-2a.5.5 0 01-.5-.5zM14 9.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-2a.5.5 0 01-.5-.5z"/>
          <path d="M9 15c.83.67 1.83 1 3 1s2.17-.33 3-1"/>
        </svg>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="message-body">
      <!-- 角色标签（用户消息不显示标签） -->
      <div v-if="role !== 'user'" class="message-role">{{ modelName }}</div>

      <!-- 用户消息：纯文本 -->
      <div v-if="role === 'user'" class="message-text">
        {{ content }}
      </div>

      <!-- AI 消息：Block 渲染 -->
      <div v-else class="message-blocks">
        <!-- 空内容占位（等待 AI 回复） -->
        <div v-if="!hasContent && isLastAssistant && isStreaming" class="message-waiting">
          <span class="waiting-dot">●</span>
          <span class="waiting-dot">●</span>
          <span class="waiting-dot">●</span>
        </div>
        <div v-else-if="!hasContent" class="message-empty">
          暂无内容
        </div>

        <MessageContent
          v-else
          :blocks="blocks"
          :is-streaming="isLastAssistant && isStreaming"
        />

        <!-- 底部信息栏 -->
        <div v-if="meta?.usage && !isStreaming" class="message-meta">
          <span class="meta-item" v-if="meta.duration">
            ⏱️ {{ meta.duration }}s
          </span>
          <span class="meta-item" v-if="meta.usage?.total_tokens">
            🪙 {{ meta.usage.total_tokens }} tokens
          </span>
          <span class="meta-item">
            {{ meta.model || 'AI' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MessageContent from './MessageContent.vue'

const props = defineProps({
  message: { type: Object, required: true },
  isLastAssistant: { type: Boolean, default: false },
  isStreaming: { type: Boolean, default: false }
})

const role = computed(() => props.message.role)
const content = computed(() => props.message.content || '')
const blocks = computed(() => props.message.blocks || [])
const meta = computed(() => props.message.meta || {})

const modelName = computed(() => {
  const modelId = meta.value.model || ''
  if (modelId.includes('reasoner')) return 'DeepSeek R1'
  if (modelId.includes('chat')) return 'DeepSeek V3'
  return 'AI 助手'
})

const hasContent = computed(() => blocks.value.length > 0)
</script>

<style scoped>
.chat-message {
  display: flex;
  gap: 14px;
  padding: 16px 0;
}

.chat-message.user {
  flex-direction: row-reverse;
}

/* 头像 */
.message-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
}

.assistant-avatar {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
}

/* 消息体 */
.message-body {
  flex: 1;
  min-width: 0;
  max-width: calc(100% - 50px);
}

.message-role {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.message-text {
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 15px;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
}

/* AI 消息气泡 */
.assistant .message-text {
  background: transparent;
  color: #334155;
  padding: 0;
}

/* 用户消息气泡 — 浅紫背景 + 深色文字 */
.user .message-text {
  background: #eef2ff;
  color: #1e293b;
  border: 1px solid #e0e7ff;
  border-top-right-radius: 4px;
}

.message-blocks {
  position: relative;
}

/* 等待 AI 回复 */
.message-waiting {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 0;
}

.waiting-dot {
  font-size: 8px;
  color: #a5b4fc;
  animation: dotPulse 1.4s ease-in-out infinite;
}

.waiting-dot:nth-child(2) { animation-delay: 0.2s; }
.waiting-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes dotPulse {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1.2); }
}

.message-empty {
  color: #94a3b8;
  font-size: 13px;
}

/* Meta 信息 */
.message-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #f1f3f6;
}

.meta-item {
  font-size: 12px;
  color: #94a3b8;
}
</style>
