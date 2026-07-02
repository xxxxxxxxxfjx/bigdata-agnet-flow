<template>
  <div :class="['katex-formula-wrapper', displayMode ? 'display-mode' : 'inline-mode']">
    <!-- 流式占位：固定高度骨架，彻底消除高度振荡 -->
    <div v-if="status === 'streaming'" class="formula-streaming">
      <span class="formula-streaming-text">{{ displayMode ? '公式渲染中...' : '$' + (formula.slice(0, 30) || '...') + '$' }}</span>
    </div>
    <!-- 完成后：一次性渲染 KaTeX -->
    <div v-else-if="renderedFormula" v-html="renderedFormula"></div>
    <div v-else-if="formula" class="formula-raw">{{ formula }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import katex from 'katex'

const props = defineProps({
  formula: { type: String, default: '' },
  displayMode: { type: Boolean, default: true },
  status: { type: String, default: 'done' }
})

const renderedFormula = computed(() => {
  if (props.status === 'streaming' || !props.formula) return ''
  try {
    return katex.renderToString(props.formula, {
      throwOnError: false,
      errorColor: '#94a3b8',
      displayMode: props.displayMode,
      trust: true,
      strict: false
    })
  } catch {
    return `<span style="color:#94a3b8;font-family:monospace;font-size:13px;">${escapeHtml(props.formula)}</span>`
  }
})

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
</script>

<style scoped>
.katex-formula-wrapper.display-mode { margin: 16px 0; padding: 12px 0; text-align: center; overflow-x: auto; }
.katex-formula-wrapper.inline-mode { display: inline; }
/* 流式占位：固定高度，内容不参与布局变化 */
.formula-streaming {
  display: flex; align-items: center; justify-content: center;
  min-height: 56px;
}
.formula-streaming-text {
  color: #94a3b8; font-size: 13px;
  animation: pulse 1.5s infinite;
}
.inline-mode .formula-streaming {
  display: inline-flex; min-height: unset;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
.formula-raw {
  display: inline-block; padding: 6px 12px; color: #64748b;
  font-family: 'JetBrains Mono', monospace; font-size: 13px;
  background: #f8f9fb; border-radius: 4px;
  border: 1px solid #e8eaf0;
}
.display-mode .formula-raw { display: block; text-align: center; }
</style>
