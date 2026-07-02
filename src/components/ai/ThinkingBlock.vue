<template>
  <div class="thinking-wrapper">
    <div class="thinking-header" @click="toggleCollapse">
      <div class="thinking-header-left">
        <svg class="thinking-icon" :class="{ active: !collapsed }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2z"/>
          <path d="M7 9.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-2a.5.5 0 01-.5-.5zM14 9.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-2a.5.5 0 01-.5-.5z"/>
          <path d="M9 15c.83.67 1.83 1 3 1s2.17-.33 3-1"/>
        </svg>
        <span class="thinking-title">深度思考
          <span v-if="status === 'streaming'" class="thinking-status">中...</span>
          <span v-else class="thinking-done-badge">✓</span>
        </span>
      </div>
      <svg class="collapse-arrow" :class="{ collapsed: collapsed }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>
    <div v-show="!collapsed" class="thinking-content"><div v-html="renderedContent"></div></div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { renderInlineMarkdown } from '../../composables/useMarkdown.js'

const props = defineProps({
  content: { type: String, default: '' },
  status: { type: String, default: 'done' }
})
const collapsed = ref(false)
const renderedContent = computed(() => renderInlineMarkdown(props.content))
function toggleCollapse() { collapsed.value = !collapsed.value }
</script>

<style scoped>
.thinking-wrapper {
  margin: 12px 0; border-radius: 8px; overflow: hidden;
  border: 1px solid #e0e7ff; background: #f8faff;
}
.thinking-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 14px; cursor: pointer; user-select: none; transition: background 0.2s;
}
.thinking-header:hover { background: #f0f4ff; }
.thinking-header-left { display: flex; align-items: center; gap: 8px; }
.thinking-icon { color: #94a3b8; flex-shrink: 0; transition: color 0.3s; }
.thinking-icon.active { color: #6366f1; }
.thinking-title {
  font-size: 13px; color: #64748b; display: flex; align-items: center; gap: 6px;
}
.thinking-status { color: #6366f1; animation: pulse 1.5s ease-in-out infinite; font-size: 12px; }
.thinking-done-badge { color: #10b981; font-size: 11px; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
.collapse-arrow { color: #94a3b8; transition: transform 0.3s; flex-shrink: 0; }
.collapse-arrow.collapsed { transform: rotate(-90deg); }
.thinking-content {
  padding: 0 14px 14px; font-size: 13px; line-height: 1.7; color: #64748b;
  border-top: 1px solid #e0e7ff; max-height: 300px; overflow-y: auto;
  white-space: pre-wrap; word-break: break-word;
}
.thinking-content :deep(strong) { color: #475569; }
.thinking-content :deep(code) {
  background: #eef2ff; padding: 1px 5px; border-radius: 3px; font-size: 12px; color: #4f46e5;
}
.thinking-content :deep(.katex) { font-size: 1em; }
</style>
