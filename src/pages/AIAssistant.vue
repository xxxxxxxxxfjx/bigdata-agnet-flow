<template>
  <div class="ai-assistant">
    <!-- 左侧对话列表 -->
    <aside class="ai-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <ConversationList
        :conversations="conversations"
        :currentId="currentConversationId"
        @newChat="handleNewChat"
        @switch="handleSwitch"
        @delete="handleDelete"
      />
    </aside>

    <!-- 主区域 -->
    <div class="ai-main">
      <!-- 顶栏 -->
      <div class="ai-topbar">
        <button class="btn-toggle-sidebar" @click="sidebarCollapsed = !sidebarCollapsed" title="切换侧边栏">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div class="topbar-title">{{ currentConversation?.title || 'AI 智能助手' }}</div>
        <div class="topbar-actions">
          <button class="btn-icon" @click="handleNewChat" title="新建对话">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 消息列表 -->
      <div class="ai-messages" ref="messagesContainer" @scroll="onMessagesScroll">
        <!-- 空状态 -->
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-logo">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2z"/>
              <path d="M7 9.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-2a.5.5 0 01-.5-.5zM14 9.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-2a.5.5 0 01-.5-.5z"/>
              <path d="M9 15c.83.67 1.83 1 3 1s2.17-.33 3-1"/>
            </svg>
          </div>
          <div class="empty-title">AI 智能助手</div>
          <div class="empty-desc">
            支持 Markdown 渲染 · 代码高亮 · KaTeX 公式 · Mermaid 图表 · 思维导图
          </div>
        </div>

        <!-- 消息列表 -->
        <ChatMessage
          v-for="(msg, idx) in messages"
          :key="msg.id"
          :message="msg"
          :is-last-assistant="idx === messages.length - 1 && msg.role === 'assistant'"
          :is-streaming="isStreaming"
        />

        <!-- 滚动锚点 -->
        <div ref="bottomAnchor"></div>
      </div>

      <!-- 底部输入 -->
      <ChatInput
        ref="chatInputRef"
        :is-streaming="isStreaming"
        @send="handleSend"
        @stop="handleStop"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useChat } from '../composables/useChat.js'
import ConversationList from '../components/ai/ConversationList.vue'
import ChatMessage from '../components/ai/ChatMessage.vue'
import ChatInput from '../components/ai/ChatInput.vue'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github.css'

const {
  conversations,
  currentConversationId,
  currentConversation,
  messages,
  isStreaming,
  createNewConversation,
  switchConversation,
  deleteConversation,
  sendMessage,
  stopGeneration
} = useChat()

const sidebarCollapsed = ref(false)
const messagesContainer = ref(null)
const bottomAnchor = ref(null)
const chatInputRef = ref(null)
let userScrolledUp = false
let scrollThrottle = null

// 检测用户是否手动上滚
function onMessagesScroll() {
  const el = messagesContainer.value
  if (!el) return
  const threshold = 80 // 距离底部 80px 内视为"在底部"
  userScrolledUp = (el.scrollHeight - el.scrollTop - el.clientHeight) > threshold
}

// 自动滚动（流式期间用 instant 避免 smooth 冲突）
function scrollToBottom(force = false) {
  if (scrollThrottle) return
  scrollThrottle = requestAnimationFrame(() => {
    scrollThrottle = null
    if (!force && userScrolledUp) return // 用户上滚了就不拉
    const el = messagesContainer.value
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: isStreaming.value ? 'instant' : 'smooth' })
    }
  })
}

// 发送新消息时强拉到最底部
watch(() => messages.value.length, () => {
  userScrolledUp = false
  scrollToBottom(true)
})

// 流式更新时自动滚（除非用户上滚）
watch(messages, () => {
  scrollToBottom()
}, { deep: true })

// ===== 事件处理 =====

function handleSend(text) {
  sendMessage(text)
  // 发送后聚焦输入框
  nextTick(() => chatInputRef.value?.focus())
}

function handleStop() {
  stopGeneration()
}

function handleNewChat() {
  createNewConversation()
  sidebarCollapsed.value = false
  nextTick(() => chatInputRef.value?.focus())
}

function handleSwitch(convId) {
  switchConversation(convId)
}

function handleDelete(convId) {
  deleteConversation(convId)
}
</script>

<style scoped>
.ai-assistant {
  display: flex;
  height: 100%;
  overflow: hidden;
}

/* ===== 侧边栏 ===== */
.ai-sidebar {
  width: 260px;
  flex-shrink: 0;
  transition: width 0.3s, opacity 0.3s;
  overflow: hidden;
}

.ai-sidebar.collapsed {
  width: 0;
}

/* ===== 主区域 ===== */
.ai-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #f8f9fb;
  color: #1e293b;
}

/* 顶栏 */
.ai-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 48px;
  background: #ffffff;
  border-bottom: 1px solid #e8eaf0;
  flex-shrink: 0;
}

.btn-toggle-sidebar {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-toggle-sidebar:hover {
  color: #1e293b;
  background: #f1f3f6;
}

.topbar-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topbar-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon:hover {
  color: #1e293b;
  background: #f1f3f6;
}

/* 消息区域 */
.ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px;
  scroll-behavior: smooth;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  padding: 40px 20px;
}

.empty-logo {
  color: #6366f1;
  opacity: 0.5;
}

.empty-title {
  font-size: 24px;
  font-weight: 700;
  color: #334155;
}

.empty-desc {
  font-size: 13px;
  color: #94a3b8;
  text-align: center;
  line-height: 1.6;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .ai-sidebar {
    position: fixed;
    top: 48px;
    left: 0;
    bottom: 0;
    z-index: 100;
    width: 260px;
    box-shadow: 4px 0 16px rgba(0, 0, 0, 0.3);
  }

  .ai-sidebar.collapsed {
    width: 0;
  }

  .ai-messages {
    padding: 0 12px;
  }
}

/* ===== 滚动条 ===== */
.ai-messages::-webkit-scrollbar {
  width: 6px;
}

.ai-messages::-webkit-scrollbar-track {
  background: transparent;
}

.ai-messages::-webkit-scrollbar-thumb {
  background: #d0d5dd;
  border-radius: 3px;
}

.ai-messages::-webkit-scrollbar-thumb:hover {
  background: #b0b8c4;
}
</style>
