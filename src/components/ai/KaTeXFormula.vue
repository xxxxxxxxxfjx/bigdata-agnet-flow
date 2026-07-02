<template>
  <div :class="['katex-formula-wrapper', displayMode ? 'display-mode' : 'inline-mode']">
    <div v-if="renderedFormula" v-html="renderedFormula"></div>
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
  if (!props.formula) return ''
  try {
    return katex.renderToString(props.formula, {
      throwOnError: false,
      errorColor: '#94a3b8',   // 错误时灰色而非红色
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
.formula-raw {
  display: inline-block; padding: 6px 12px; color: #94a3b8;
  font-family: 'JetBrains Mono', monospace; font-size: 13px;
}
</style>
