<template>
  <div class="code-block-wrapper">
    <div class="code-block-header">
      <span class="code-lang">{{ language }}</span>
      <button class="code-copy-btn" :class="{ copied: copySuccess }" @click="copyCode" :title="copySuccess ? '已复制！' : '复制代码'">
        <svg v-if="!copySuccess" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>
    </div>
    <pre class="code-block-body"><code v-html="highlightedCode"></code></pre>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import hljs from 'highlight.js'

const props = defineProps({
  code: { type: String, default: '' },
  language: { type: String, default: 'plaintext' }
})
const copySuccess = ref(false)

const highlightedCode = computed(() => {
  const lang = hljs.getLanguage(props.language) ? props.language : 'plaintext'
  try { return hljs.highlight(props.code, { language: lang }).value }
  catch { return hljs.highlightAuto(props.code).value }
})

function copyCode() {
  navigator.clipboard.writeText(props.code).then(() => {
    copySuccess.value = true
    setTimeout(() => { copySuccess.value = false }, 2000)
  }).catch(() => {
    const t = document.createElement('textarea')
    t.value = props.code; t.style.position = 'fixed'; t.style.opacity = '0'
    document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t)
    copySuccess.value = true
    setTimeout(() => { copySuccess.value = false }, 2000)
  })
}
</script>

<style scoped>
.code-block-wrapper {
  margin: 12px 0; border-radius: 8px; overflow: hidden;
  border: 1px solid #e2e5ea; background: #fafbfc;
}
.code-block-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 12px; background: #f0f1f5; border-bottom: 1px solid #e8eaf0;
}
.code-lang { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
.code-copy-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border: none; background: transparent;
  color: #94a3b8; border-radius: 4px; cursor: pointer; transition: all 0.2s;
}
.code-copy-btn:hover { color: #475569; background: #e8eaf0; }
.code-copy-btn.copied { background: rgba(16, 185, 129, 0.08); }
.code-block-body {
  margin: 0; padding: 14px 16px; overflow-x: auto;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px; line-height: 1.65; color: #334155;
}
.code-block-body code { font-family: inherit; font-size: inherit; }
</style>
